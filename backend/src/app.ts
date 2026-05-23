/**
 * @module app
 * @description Express application factory.
 *
 * Middleware order (critical — do NOT reorder carelessly):
 *  1.  Trust proxy           — Correct IP behind load balancer/nginx
 *  2.  Compression           — gzip before any response work
 *  3.  CORS                  — Must be before any route/body parsing
 *  4.  Security headers      — Helmet CSP/HSTS/etc
 *  5.  HTTP Logger           — Log raw requests before auth/body parse
 *  6.  Body parsers          — express.json / urlencoded
 *  7.  NoSQL sanitization    — After body parse, before routing
 *  8.  XSS protection        — After body parse
 *  9.  HPP protection        — After body parse (protects query params too)
 *  10. Request ID            — Attach before rate limiters (for error tracing)
 *  11. Global rate limiter   — After ID so we can log which request was limited
 *  12. Health check          — Bypass rate limiter via skip(), but keep here for clarity
 *  13. Routes                — Business logic
 *  14. 404 handler           — Catch unmatched routes
 *  15. Error handler         — Must be LAST, receives forwarded errors
 */

import express, { Application, Request, Response } from 'express';
import compression from 'compression';
import { StatusCodes } from 'http-status-codes';

// ─── Config ────────────────────────────────────────────────────────────────────
import { env } from './config/env';

// ─── Middleware ────────────────────────────────────────────────────────────────
import { corsMiddleware } from './middleware/cors.middleware';
import {
  helmetMiddleware,
  mongoSanitizeMiddleware,
  xssProtect,
  hppProtect,
  suspiciousRequestGuard,
} from './middleware/security.middleware';
import { httpLogger, errorHttpLogger } from './middleware/httpLogger.middleware';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestId } from './middleware/requestId';
import { globalLimiter } from './middleware/rateLimiter.middleware';
import { mockDataMiddleware } from './middleware/mockData.middleware';

// ─── Routes ────────────────────────────────────────────────────────────────────
import authRoutes      from './routes/auth.routes';
import newsRoutes      from './routes/news.routes';
import aiRoutes        from './routes/ai.routes';
import userRoutes      from './routes/user.routes';
import categoryRoutes  from './routes/category.routes';
import searchRoutes    from './routes/search.routes';
import analyticsRoutes from './routes/analytics.routes';
import feedRoutes      from './routes/feed.routes';
import jobsRoutes      from './routes/jobs.routes';

const app: Application = express();
const API = `/api/${env.API_VERSION}`;

// ─── 1. Trust proxy ────────────────────────────────────────────────────────────
// Required for correct IP in req.ip when behind nginx / load balancer
app.set('trust proxy', env.IS_PRODUCTION ? 1 : false);

// ─── 2. Compression ────────────────────────────────────────────────────────────
app.use(compression({
  threshold: 1024,       // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ─── 3. CORS ──────────────────────────────────────────────────────────────────
app.use(corsMiddleware);

// ─── 4. Security headers ──────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.disable('x-powered-by'); // Belt-and-suspenders alongside helmet

// ─── 5. HTTP request logging ──────────────────────────────────────────────────
app.use(httpLogger);

// ─── 6. Body parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── 7–9. Sanitization ────────────────────────────────────────────────────────
app.use(mongoSanitizeMiddleware);
app.use(xssProtect);
app.use(hppProtect);
app.use(suspiciousRequestGuard); // Block path traversal, proto pollution, SQLi


// ─── 10. Request ID ───────────────────────────────────────────────────────────
app.use(requestId);
// app.use(mockDataMiddleware); // Disabled to allow real data flow

// ─── 11. Global rate limiter ──────────────────────────────────────────────────
app.use(`${API}/`, globalLimiter);

// ─── 11b. API index (base route) ──────────────────────────────────────────────
app.get(API, (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    success: true,
    status: 'ok',
    name: 'news-intelligence-api',
    version: process.env.npm_package_version ?? '1.0.0',
    apiBase: API,
    endpoints: {
      health: `${API}/health`,
      auth: `${API}/auth`,
      news: `${API}/news`,
      ai: `${API}/ai`,
      users: `${API}/users`,
      categories: `${API}/categories`,
      search: `${API}/search`,
      analytics: `${API}/analytics`,
      feeds: `${API}/feeds`,
      jobs: `${API}/jobs`,
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── 12. Health check ─────────────────────────────────────────────────────────
app.get(`${API}/health`, (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    success:     true,
    status:      'healthy',
    timestamp:   new Date().toISOString(),
    environment: env.NODE_ENV,
    version:     process.env.npm_package_version ?? '1.0.0',
    uptime:      `${Math.floor(process.uptime())}s`,
  });
});

// ─── 13. API Routes ────────────────────────────────────────────────────────────
app.use(`${API}/auth`,       authRoutes);
app.use(`${API}/news`,       newsRoutes);
app.use(`${API}/ai`,         aiRoutes);
app.use(`${API}/users`,      userRoutes);
app.use(`${API}/categories`, categoryRoutes);
app.use(`${API}/search`,     searchRoutes);
app.use(`${API}/analytics`,  analyticsRoutes);
app.use(`${API}/feeds`,      feedRoutes);
app.use(`${API}/jobs`,       jobsRoutes);

// ─── 14. 404 ──────────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── 15. Error Logger + Handler ───────────────────────────────────────────────
app.use(errorHttpLogger);
app.use(errorHandler);

export default app;
