/**
 * @module io/handlers
 * @description Socket.IO event handlers for different namespaces
 */

import { SocketIOServer, SocketType } from './socket.config';
import { logger } from '../utils/logger';

/**
 * Setup all Socket.IO namespaces and event handlers
 */
export const setupSocketIOHandlers = (io: SocketIOServer) => {
  // ─── /news namespace: Real-time article updates ────────────────────────────────
  const newsNamespace = io.of('/news');

  newsNamespace.on('connection', (socket: SocketType) => {
    logger.info(`📰 Client connected to /news: ${socket.id}`);

    // Allow clients to join specific category/filter rooms
    socket.on('subscribe', (data: { category?: string; keyword?: string }) => {
      const room = data.category ? `category:${data.category}` : 'all-news';
      socket.join(room);
      logger.debug(`📌 Socket ${socket.id} joined room: ${room}`);
      socket.emit('subscribed', { room, timestamp: new Date().toISOString() });
    });

    socket.on('unsubscribe', (data: { category?: string }) => {
      const room = data.category ? `category:${data.category}` : 'all-news';
      socket.leave(room);
      logger.debug(`📌 Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      logger.info(`📰 Client disconnected from /news: ${socket.id}`);
    });
  });

  // ─── /trending namespace: Real-time trending data ────────────────────────────────
  const trendingNamespace = io.of('/trending');

  trendingNamespace.on('connection', (socket: SocketType) => {
    logger.info(`🔥 Client connected to /trending: ${socket.id}`);

    // Subscribe to trending updates
    socket.on('watch', () => {
      socket.join('trending-updates');
      logger.debug(`📌 Socket ${socket.id} subscribed to trending updates`);
      socket.emit('watching', { timestamp: new Date().toISOString() });
    });

    socket.on('unwatch', () => {
      socket.leave('trending-updates');
      logger.debug(`📌 Socket ${socket.id} unsubscribed from trending updates`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔥 Client disconnected from /trending: ${socket.id}`);
    });
  });

  // ─── /analytics namespace: Real-time analytics updates ──────────────────────────
  const analyticsNamespace = io.of('/analytics');

  analyticsNamespace.on('connection', (socket: SocketType) => {
    logger.info(`📊 Client connected to /analytics: ${socket.id}`);

    // Subscribe to analytics updates
    socket.on('watch', () => {
      socket.join('analytics-updates');
      logger.debug(`📌 Socket ${socket.id} subscribed to analytics updates`);
      socket.emit('watching', { timestamp: new Date().toISOString() });
    });

    socket.on('unwatch', () => {
      socket.leave('analytics-updates');
      logger.debug(`📌 Socket ${socket.id} unsubscribed from analytics updates`);
    });

    socket.on('disconnect', () => {
      logger.info(`📊 Client disconnected from /analytics: ${socket.id}`);
    });
  });

  // ─── /notifications namespace: Real-time notifications ─────────────────────────
  const notificationsNamespace = io.of('/notifications');

  notificationsNamespace.on('connection', (socket: SocketType) => {
    logger.info(`🔔 Client connected to /notifications: ${socket.id}`);

    // Join user-specific notification room if authenticated
    if (socket.data.authenticated && socket.data.user) {
      const userRoom = `user:${socket.data.user.id}`;
      socket.join(userRoom);
      logger.debug(`📌 Socket ${socket.id} joined user room: ${userRoom}`);
    }

    // Subscribe to global breaking news
    socket.on('watch-breaking', () => {
      socket.join('breaking-news');
      logger.debug(`📌 Socket ${socket.id} subscribed to breaking news`);
      socket.emit('watching-breaking', { timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', () => {
      logger.info(`🔔 Client disconnected from /notifications: ${socket.id}`);
    });
  });

  logger.info('✅ Socket.IO handlers registered for all namespaces');
};

/**
 * Broadcast utilities for emitting events to clients
 */
export const broadcasters = {
  /**
   * Broadcast new article to news namespace
   */
  broadcastNewArticle: (io: SocketIOServer, article: any, category?: string) => {
    const namespace = io.of('/news');
    const room = category ? `category:${category}` : 'all-news';
    namespace.to(room).emit('new-article', {
      article,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`📰 Broadcasted new article to room: ${room}`);
  },

  /**
   * Broadcast trending update
   */
  broadcastTrendingUpdate: (io: SocketIOServer, trends: any) => {
    io.of('/trending')
      .to('trending-updates')
      .emit('trending-updated', {
        trends,
        timestamp: new Date().toISOString(),
      });
    logger.debug('🔥 Broadcasted trending update');
  },

  /**
   * Broadcast sentiment analytics update
   */
  broadcastAnalyticsUpdate: (io: SocketIOServer, analytics: any) => {
    io.of('/analytics')
      .to('analytics-updates')
      .emit('analytics-updated', {
        analytics,
        timestamp: new Date().toISOString(),
      });
    logger.debug('📊 Broadcasted analytics update');
  },

  /**
   * Broadcast breaking news notification
   */
  broadcastBreakingNews: (io: SocketIOServer, article: any) => {
    io.of('/notifications')
      .to('breaking-news')
      .emit('breaking-news', {
        article,
        timestamp: new Date().toISOString(),
      });
    logger.debug('🚨 Broadcasted breaking news');
  },

  /**
   * Send user-specific notification
   */
  sendUserNotification: (io: SocketIOServer, userId: string, notification: any) => {
    const userRoom = `user:${userId}`;
    io.of('/notifications')
      .to(userRoom)
      .emit('notification', {
        notification,
        timestamp: new Date().toISOString(),
      });
    logger.debug(`📬 Sent notification to user: ${userId}`);
  },
};
