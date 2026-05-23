/**
 * @module utils/logger
 * @description Structured logger facade over Winston. Use this everywhere in
 * the application instead of console.log. Supports child loggers with context.
 *
 * Log levels (lowest → highest):
 *   error | warn | info | http | verbose | debug | silly
 *
 * In production: only info+ goes to console; all levels go to files.
 * In development: debug+ goes to colorized console.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from '../config/env';

const { combine, timestamp, errors, json, colorize, printf, splat } = winston.format;

// ─── Custom dev format ─────────────────────────────────────────────────────────
const devFormat = printf(({ level, message, timestamp: ts, label: lbl, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const labelStr = lbl ? ` [${lbl as string}]` : '';
  return `${ts as string}${labelStr} [${level}]: ${(stack ?? message) as string}${metaStr}`;
});

// ─── Transports ────────────────────────────────────────────────────────────────
const transports: winston.transport[] = [
  // Console
  new winston.transports.Console({
    level: env.IS_PRODUCTION ? 'info' : env.LOG_LEVEL,
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss' }),
      errors({ stack: true }),
      splat(),
      devFormat
    ),
    silent: env.IS_TEST,
  }),
];

// File transports only outside test env
if (!env.IS_TEST) {
  try {
    // Combined daily rotating log
    transports.push(
      new DailyRotateFile({
        filename: path.resolve('logs/combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: 'debug',
        format: combine(timestamp(), errors({ stack: true }), json()),
      }) as unknown as winston.transport
    );

    // Error-only daily rotating log
    transports.push(
      new DailyRotateFile({
        filename: path.resolve('logs/error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: combine(timestamp(), errors({ stack: true }), json()),
      }) as unknown as winston.transport
    );
  } catch {
    // Fallback to simple file if daily-rotate not available
    transports.push(
      new winston.transports.File({ filename: env.LOG_FILE, level: 'debug' }),
      new winston.transports.File({ filename: env.LOG_ERROR_FILE, level: 'error' })
    );
  }
}

// ─── Root logger ───────────────────────────────────────────────────────────────
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: 'news-intelligence-api', env: env.NODE_ENV },
  transports,
  exceptionHandlers: env.IS_TEST ? [] : [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: env.IS_TEST ? [] : [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
  exitOnError: false,
});

// ─── Child logger factory ──────────────────────────────────────────────────────
/**
 * Creates a child logger with a module/context label.
 * @example const log = createLogger('ArticleService');
 *          log.info('Fetching articles');
 */
export const createLogger = (moduleName: string): winston.Logger => {
  return logger.child({ label: moduleName });
};

// ─── Convenience stream for Morgan ────────────────────────────────────────────
export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};
