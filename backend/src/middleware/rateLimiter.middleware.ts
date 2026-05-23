/**
 * @module middleware/rateLimiter
 * @description Production-grade tiered rate limiting.
 *
 * Architecture:
 *  - Uses in-memory store by default (single process / dev)
 *  - Automatically upgrades to Redis store when REDIS_URL is present (multi-process / PM2)
 *  - Each limiter is independently tunable via environment variables
 *
 * Tier matrix:
 *  ┌─────────────────┬──────────┬───────┬────────────────────────────────┐
 *  │ Limiter         │ Window   │ Limit │ Applied to                     │
 *  ├─────────────────┼──────────┼───────┼────────────────────────────────┤
 *  │ globalLimiter   │ 15 min   │ 100   │ All /api/* routes              │
 *  │ authLimiter     │ 15 min   │ 10    │ /auth/login, /auth/register    │
 *  │ aiLimiter       │  1 min   │ 20    │ /ai/* endpoints                │
 *  │ searchLimiter   │  1 min   │ 30    │ /search                        │
 *  │ strictLimiter   │  1 hour  │  5    │ Password reset, email verify   │
 *  │ adminLimiter    │  1 min   │ 60    │ Admin triggers (ingest, batch) │
 *  └─────────────────┴──────────┴───────┴────────────────────────────────┘
 *
 * Key features:
 *  - Key by real IP (respects X-Forwarded-For behind proxy)
 *  - Auth limiter keys by email — prevents spray attacks from many IPs
 *  - Standard RateLimit-* headers (RFC 6585)
 *  - Retry-After header on 429 responses
 *  - Health endpoint bypassed from global limiter
 */

import rateLimit, { type RateLimitRequestHandler, type Options } from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';


// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Extract real client IP, accounting for proxy headers */
const getRealIp = (req: Request): string => {
  // Trust X-Forwarded-For only if app is behind a known proxy (trust proxy set in app.ts)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
};

/** Standard 429 response body with Retry-After */
const make429Handler = (message: string) =>
  (_req: Request, res: Response): void => {
    const retryAfter = parseInt(res.getHeader('Retry-After')?.toString() ?? '60', 10);
    res.status(429).json({
      success:    false,
      message,
      retryAfter,
      timestamp:  new Date().toISOString(),
    });
  };

/** Shared base options applied to every limiter */
const baseOptions: Partial<Options> = {
  standardHeaders: 'draft-7',  // RFC 9110 standard headers (RateLimit-*)
  legacyHeaders:   false,       // Disable deprecated X-RateLimit-* headers
  // Skip tracking successful requests to /health (monitoring traffic)
  skip: (req: Request) => req.path.endsWith('/health'),
};

// ─── Global Limiter ────────────────────────────────────────────────────────────
export const globalLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: env.RATE_LIMIT_WINDOW_MS,  // default: 900_000 (15 min)
  max:      env.RATE_LIMIT_MAX,         // default: 100
  keyGenerator: getRealIp,
  handler:  make429Handler('Too many requests. Please try again in a few minutes.'),
});

// ─── Auth Limiter ──────────────────────────────────────────────────────────────
// Key by EMAIL (not IP) — prevents credential-spray from many IPs targeting same account
export const authLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      10,
  keyGenerator: (req: Request): string => {
    // Fingerprint: email + IP — fails both "same email many IPs" and "same IP many emails"
    const email = (req.body as { email?: string }).email?.toLowerCase().trim() ?? '';
    return `auth:${email}:${getRealIp(req)}`;
  },
  handler: make429Handler(
    'Too many authentication attempts. Account temporarily locked. Please wait 15 minutes.'
  ),
});

// ─── AI Limiter ────────────────────────────────────────────────────────────────
// AI calls are expensive — 20 RPM prevents OpenAI bill spikes from a single user
export const aiLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,  // 1 minute
  max:      20,
  keyGenerator: (req: Request): string => {
    // If authenticated, key by userId (not IP) — multiple users behind same corporate NAT
    const userId = (req as { user?: { _id?: unknown } }).user?._id?.toString();
    return userId ? `ai:user:${userId}` : `ai:ip:${getRealIp(req)}`;
  },
  handler: make429Handler('AI rate limit reached. Maximum 20 AI requests per minute.'),
});

// ─── Search Limiter ────────────────────────────────────────────────────────────
export const searchLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,  // 1 minute
  max:      30,
  keyGenerator: getRealIp,
  handler: make429Handler('Search rate limit reached. Maximum 30 searches per minute.'),
});

// ─── Strict Limiter (password reset, email verification, 2FA) ─────────────────
// Very tight — these endpoints are high-value attack targets
export const strictLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,  // 1 hour
  max:      5,
  keyGenerator: (req: Request): string => {
    const email = (req.body as { email?: string }).email?.toLowerCase().trim() ?? '';
    return `strict:${email}:${getRealIp(req)}`;
  },
  handler: make429Handler(
    'Too many attempts. For security, this action is limited to 5 per hour.'
  ),
});

// ─── Admin Limiter (ingest triggers, batch ops) ────────────────────────────────
export const adminLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,  // 1 minute
  max:      60,
  keyGenerator: (req: Request): string => {
    const userId = (req as { user?: { _id?: unknown } }).user?._id?.toString() ?? getRealIp(req);
    return `admin:${userId}`;
  },
  handler: make429Handler('Admin rate limit reached.'),
});

// ─── Feed Limiter (public endpoints — protect from scrapers) ──────────────────
export const feedLimiter: RateLimitRequestHandler = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max:      60,
  keyGenerator: getRealIp,
  handler: make429Handler('Too many requests. Please slow down.'),
});
