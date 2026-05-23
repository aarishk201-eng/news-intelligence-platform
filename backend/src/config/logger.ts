import winston from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, colorize, printf, splat } = winston.format;

// ─── Custom Log Format ─────────────────────────────────────────────────────────
const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts as string} [${level}]: ${stack ?? (message as string)}`;
});

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'debug',
  format: combine(
    errors({ stack: true }),
    splat(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'news-intelligence-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize({ all: !isProduction }),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        devFormat
      ),
      silent: process.env.NODE_ENV === 'test',
    }),
    // Combined file transport
    new winston.transports.File({
      filename: path.resolve(process.env.LOG_FILE ?? 'logs/combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    // Error-only file transport
    new winston.transports.File({
      filename: path.resolve(process.env.LOG_ERROR_FILE ?? 'logs/error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Add HTTP level
winston.addColors({ http: 'magenta' });
