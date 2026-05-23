import cors from 'cors';
import { CorsOptions } from 'cors';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * @module middleware/cors
 * @description Dynamic CORS configuration.
 *
 * - Reads allowed origins from env.ALLOWED_ORIGINS (comma-separated)
 * - In development, also allows localhost variants and null (Postman file://)
 * - In production, strictly enforces whitelist
 * - Preflight requests are handled automatically
 */

const ALLOWED_METHODS  = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS  = ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Api-Key'];
const EXPOSED_HEADERS  = ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'];

const buildOriginList = (): (string | RegExp)[] => {
  const explicit = env.ALLOWED_ORIGINS
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (!env.IS_PRODUCTION) {
    return [
      ...explicit,
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
    ];
  }

  return explicit;
};

const allowedOrigins = buildOriginList();

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) {
      if (env.IS_PRODUCTION) {
        callback(null, false);
      } else {
        callback(null, true);
      }
      return;
    }

    const isAllowed = allowedOrigins.some((allowed) =>
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked: origin "${origin}" not in whitelist`);
      callback(new Error(`CORS: Origin "${origin}" is not allowed`));
    }
  },
  credentials:     true,
  methods:         ALLOWED_METHODS,
  allowedHeaders:  ALLOWED_HEADERS,
  exposedHeaders:  EXPOSED_HEADERS,
  maxAge:          86_400,         // Preflight cache: 24h
  optionsSuccessStatus: 200,       // IE11 compat
};

export const corsMiddleware = cors(corsOptions);
