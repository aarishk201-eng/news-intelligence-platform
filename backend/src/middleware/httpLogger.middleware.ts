import morgan from 'morgan';
import { Request, Response } from 'express';
import { morganStream } from '../utils/logger';
import { env } from '../config/env';

// ─── Token definitions ─────────────────────────────────────────────────────────
morgan.token('request-id', (req: Request) => req.headers['x-request-id'] as string ?? '-');
morgan.token('user-id',    (req: Request) => (req as { user?: { _id?: unknown } }).user?._id?.toString() ?? '-');
morgan.token('body-size',  (_req: Request, res: Response) => res.getHeader('content-length')?.toString() ?? '0');
morgan.token('real-ip',    (req: Request) => (
  req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ??
  req.socket.remoteAddress ??
  '-'
));

// ─── Format strings ────────────────────────────────────────────────────────────

/**
 * Production: structured single-line JSON-friendly format for log aggregators.
 * Development: concise colored format for readability.
 */
const PROD_FORMAT = ':real-ip :request-id :user-id :method :url HTTP/:http-version :status :body-size - :response-time ms';
const DEV_FORMAT  = ':method :url :status :response-time ms - :body-size b [:request-id]';

export const httpLogger = morgan(
  env.IS_PRODUCTION ? PROD_FORMAT : DEV_FORMAT,
  {
    stream: morganStream,
    // Skip health checks to avoid log spam
    skip: (req: Request, res: Response) =>
      req.path.includes('/health') || (env.IS_PRODUCTION && res.statusCode < 400),
  }
);

/**
 * Separate error-only logger that logs all 4xx/5xx regardless of environment.
 * Mount AFTER httpLogger.
 */
export const errorHttpLogger = morgan(
  ':real-ip :request-id :user-id :method :url :status - :response-time ms',
  {
    stream: morganStream,
    skip: (_req: Request, res: Response) => res.statusCode < 400,
  }
);
