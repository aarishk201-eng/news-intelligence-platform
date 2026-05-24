/**
 * @module io/socket.config
 * @description Socket.IO server configuration and initialization
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { verifyJWT } from './auth.io';

/**
 * Initialize Socket.IO with Redis adapter for multi-instance scaling
 */
export const initializeSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Configure Redis adapter for horizontal scaling (if Redis available)
  if (env.ENABLE_CACHE) {
    try {
      const pubClient = new Redis(env.REDIS_URL, {
        password: env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 1000)),
        connectTimeout: 3000,
      });

      const subClient = pubClient.duplicate();

      pubClient.on('error', () => {}); // Suppress after catch
      subClient.on('error', () => {}); // Suppress after catch

      Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
          io.adapter(createAdapter(pubClient, subClient));
          logger.info('✅ Socket.IO using Redis adapter for clustering');
        })
        .catch(() => {
          pubClient.disconnect();
          subClient.disconnect();
          logger.info('ℹ️ Socket.IO using in-memory adapter (Redis unavailable)');
        });
    } catch (err) {
      logger.info('ℹ️ Redis adapter setup skipped, using in-memory');
    }
  }

  // ─── Middleware ────────────────────────────────────────────────────────────────

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        // Allow unauthenticated connections but mark them
        socket.data.authenticated = false;
        socket.data.user = null;
        return next();
      }

      const decoded = await verifyJWT(token);
      socket.data.authenticated = true;
      socket.data.user = decoded;
      logger.debug('🔐 Socket authenticated', { userId: decoded.id });
      next();
    } catch (err) {
      logger.warn('⚠️ Socket authentication failed', { error: String(err) });
      socket.data.authenticated = false;
      socket.data.user = null;
      next();
    }
  });

  // ─── Connection Handler ────────────────────────────────────────────────────────

  io.on('connection', (socket: Socket) => {
    logger.info(`✅ Client connected: ${socket.id}`, {
      authenticated: socket.data.authenticated,
      userId: socket.data.user?.id,
    });

    socket.on('disconnect', (reason) => {
      logger.info(`❌ Client disconnected: ${socket.id}`, { reason });
    });

    socket.on('error', (error) => {
      logger.error('Socket error', { socketId: socket.id, error });
    });
  });

  logger.info('📡 Socket.IO initialized', { port: env.PORT });
  return io;
};

export type SocketIOServer = SocketIOServer;
export type SocketType = Socket;
