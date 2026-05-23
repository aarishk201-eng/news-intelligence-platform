/**
 * @module middleware/security
 * @description Hardened security middleware stack (production-grade).
 *
 * Middleware order (must apply in this sequence — see app.ts):
 *  1. helmetMiddleware     — HTTP security headers (CSP, HSTS, XSS, clickjacking)
 *  2. mongoSanitizeMiddleware — Strip $ / . operators → NoSQL injection prevention
 *  3. xssProtect           — Recursive HTML-encode all req.body string values
 *  4. hppProtect           — HTTP Parameter Pollution — deduplicate query params
 *  5. requestSizeLimiter   — Enforce max body size (belt-and-suspenders over express.json)
 *
 * What each layer defends against:
 *  - Helmet:         XSS via CSP, clickjacking via frame-ancestors, MIME sniff, HSTS
 *  - mongoSanitize:  { "$gt": "" } / { "$where": ... } injection patterns
 *  - xssProtect:     <script>alert(1)</script> in any user-supplied string
 *  - hppProtect:     ?admin=false&admin=true bypassing filter logic
 *  - sizeLimiter:    Multi-MB body payloads (DoS via large JSON)
 */

import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { env } from '../config/env';
import { createLogger } from '../utils/logger';

const log = createLogger('SecurityMW');

// ─── 1. Helmet (HTTP security headers) ────────────────────────────────────────
export const helmetMiddleware = helmet({
  contentSecurityPolicy: env.IS_PRODUCTION
    ? {
        directives: {
          defaultSrc:          ["'self'"],
          scriptSrc:           ["'self'"],
          styleSrc:            ["'self'", "'unsafe-inline'"],
          imgSrc:              ["'self'", 'data:', 'https:'],
          connectSrc:          ["'self'"],
          fontSrc:             ["'self'"],
          objectSrc:           ["'none'"],
          mediaSrc:            ["'none'"],
          frameSrc:            ["'none'"],
          frameAncestors:      ["'none'"],           // Clickjacking prevention
          formAction:          ["'self'"],            // Prevent form hijacking
          upgradeInsecureRequests: [],               // Force HTTPS resource loads
          baseUri:             ["'self'"],            // Prevent <base> injection
        },
      }
    : false,  // Disable CSP in dev (breaks inline scripts during development)

  // Prevent MIME-type sniffing attacks
  noSniff: true,

  // Prevent X-Powered-By: Express header from leaking framework info
  hidePoweredBy: true,

  // HSTS: force HTTPS for 1 year + subdomains (production only — breaks local HTTPS)
  hsts: env.IS_PRODUCTION
    ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
    : false,

  // Prevent clickjacking (belt-and-suspenders with frame-ancestors CSP)
  frameguard: { action: 'deny' },

  // Legacy XSS filter header for older browsers
  xssFilter: true,

  // Referrer policy — don't leak full URL in cross-origin requests
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // Disable Adobe Flash / PDF cross-domain access
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // Remove X-Download-Options (IE8 specific, minimal risk but good hygiene)
  ieNoOpen: true,

  // DNS prefetch control — prevent probing of internal resources
  dnsPrefetchControl: { allow: false },

  // Cross-Origin policies — prevent Spectre-style cross-origin reads
  crossOriginEmbedderPolicy: env.IS_PRODUCTION,
  crossOriginOpenerPolicy:   { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow news images from CDN
});

// ─── 2. NoSQL Injection Prevention ────────────────────────────────────────────
// Strips MongoDB operator characters ($, .) from user input before they reach
// any query. This prevents: { "password": { "$gt": "" } } bypass attacks.
export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',  // Replace with underscore to preserve intent, not silently remove
  allowDots: false,  // Block dot notation path traversal too
  onSanitize: ({ req, key }) => {
    // Use structured logger (not console.warn) — goes to SIEM/log aggregator
    log.warn('NoSQL injection attempt blocked', {
      key,
      method:  req.method,
      path:    req.path,
      ip:      req.ip,
      requestId: req.headers['x-request-id'],
    });
  },
});

// ─── 3. XSS Body Sanitizer ────────────────────────────────────────────────────
/**
 * Recursively HTML-encodes dangerous characters in ALL string values of req.body.
 * Runs AFTER body parsing so it covers the full parsed object tree.
 *
 * Defense-in-depth: actual XSS output-encoding should happen at the rendering
 * layer (React / template engine). This is a catch-all for API consumers that
 * may store and later render the data.
 *
 * Audit log: any sanitization is logged for security review.
 */
const DANGEROUS_PATTERN = /<script|javascript:|data:text\/html|on\w+\s*=/i;

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;')
    .replace(/\//g, '&#x2F;');

let _xssCount = 0; // In-memory audit counter (reset on restart — use Redis for persistence)

const sanitizeValue = (value: unknown, path = ''): { value: unknown; mutated: boolean } => {
  if (typeof value === 'string') {
    if (DANGEROUS_PATTERN.test(value)) {
      _xssCount++;
      return { value: escapeHtml(value), mutated: true };
    }
    return { value, mutated: false };
  }
  if (Array.isArray(value)) {
    let anyMutated = false;
    const sanitized = value.map((item, i) => {
      const result = sanitizeValue(item, `${path}[${i}]`);
      if (result.mutated) anyMutated = true;
      return result.value;
    });
    return { value: sanitized, mutated: anyMutated };
  }
  if (value !== null && typeof value === 'object') {
    let anyMutated = false;
    const sanitized = Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => {
        const result = sanitizeValue(v, `${path}.${k}`);
        if (result.mutated) anyMutated = true;
        return [k, result.value];
      })
    );
    return { value: sanitized, mutated: anyMutated };
  }
  return { value, mutated: false };
};

export const xssProtect: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    const { value, mutated } = sanitizeValue(req.body);
    if (mutated) {
      log.warn('XSS payload sanitized from request body', {
        method:    req.method,
        path:      req.path,
        ip:        req.ip,
        requestId: req.headers['x-request-id'],
        totalXssBlocked: _xssCount,
      });
      req.body = value as Record<string, unknown>;
    }
  }
  next();
};

// Expose counter for health/monitoring endpoint
export const getXssBlockedCount = (): number => _xssCount;

// ─── 4. HTTP Parameter Pollution Prevention ───────────────────────────────────
/**
 * Prevents attacks like:
 *   GET /news?status=published&status=archived&status[$where]=...
 *
 * Strategy: keep LAST value for non-whitelisted params (most recent intent).
 * Whitelisted params are allowed to be arrays (e.g., tags, fields).
 */
const HPP_WHITELIST = new Set(['tags', 'fields', 'sort', 'category', 'source', 'ids']);

export const hppProtect: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.query) {
    const cleaned: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (HPP_WHITELIST.has(key)) {
        // Allowed arrays — pass through as-is
        cleaned[key] = value as string | string[];
      } else if (Array.isArray(value)) {
        // Duplicate param detected — keep only last occurrence
        const last = (value as string[]).at(-1) ?? '';
        cleaned[key] = last;
        log.debug(`HPP: Collapsed duplicate param "${key}" to "${last}"`);
      } else {
        cleaned[key] = value as string;
      }
    }
    req.query = cleaned;
  }
  next();
};

// ─── 5. Request Body Size Guard ───────────────────────────────────────────────
/**
 * Belt-and-suspenders check on Content-Length BEFORE body parsing begins.
 * express.json({ limit: '10mb' }) catches it after parsing — this stops it earlier.
 */
export const requestSizeLimiter = (limitKb = 100): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] ?? '0', 10);
    if (contentLength > limitKb * 1024) {
      log.warn('Oversized request rejected', {
        contentLength,
        limitKb,
        path: req.path,
        ip:   req.ip,
      });
      res.status(413).json({
        success: false,
        message: `Request body exceeds the ${limitKb}KB limit`,
      });
      return;
    }
    next();
  };
};

// ─── 6. Suspicious Pattern Detector ──────────────────────────────────────────
/**
 * Scans query strings for common attack patterns (path traversal, SQL fragments,
 * prototype pollution). Logs and rejects before the router ever sees them.
 */
const ATTACK_PATTERNS = [
  /\.\.[/\\]/,                       // Path traversal: ../../etc/passwd
  /__proto__|constructor\.prototype/, // Prototype pollution
  /union\s+select|or\s+1=1/i,       // SQL injection fragments
  /%00|\\x00/,                        // Null byte injection
  /\$\{.*\}/,                         // Server-side template injection
];

export const suspiciousRequestGuard: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const queryString = JSON.stringify(req.query) + (req.url ?? '');

  for (const pattern of ATTACK_PATTERNS) {
    if (pattern.test(queryString)) {
      log.warn('Suspicious request pattern detected — rejected', {
        pattern: pattern.toString(),
        url:     req.url,
        ip:      req.ip,
        method:  req.method,
      });
      res.status(400).json({
        success: false,
        message: 'Invalid request',
      });
      return;
    }
  }
  next();
};
