/**
 * @module config/env
 * @description Validates and exports all environment variables at startup.
 * Throws immediately if required variables are missing — fail fast principle.
 */

import 'dotenv/config';

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[ENV] Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

const optionalInt = (key: string, fallback: number): number => {
  const val = process.env[key];
  return val ? parseInt(val, 10) : fallback;
};

const optionalFloat = (key: string, fallback: number): number => {
  const val = process.env[key];
  return val ? parseFloat(val) : fallback;
};

const optionalBool = (key: string, fallback: boolean): boolean => {
  const val = process.env[key];
  if (!val) return fallback;
  return val.toLowerCase() === 'true';
};

// ─── Exported Config Object ────────────────────────────────────────────────────
export const env = {
  // Application
  NODE_ENV:   optional('NODE_ENV', 'development'),
  PORT:       optionalInt('PORT', 5000),
  API_VERSION: optional('API_VERSION', 'v1'),
  IS_PRODUCTION: optional('NODE_ENV', 'development') === 'production',
  IS_TEST:    optional('NODE_ENV', 'development') === 'test',

  // Database
  MONGODB_URI: required('MONGODB_URI'),
  MONGODB_URI_TEST: optional('MONGODB_URI_TEST', ''),
  DB_POOL_SIZE: optionalInt('DB_POOL_SIZE', 10),

  // JWT
  JWT_SECRET:          required('JWT_SECRET'),
  JWT_EXPIRE:          optional('JWT_EXPIRE', '7d'),
  JWT_REFRESH_SECRET:  required('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRE:  optional('JWT_REFRESH_EXPIRE', '30d'),
  JWT_ISSUER:          optional('JWT_ISSUER', 'news-intelligence-api'),
  JWT_AUDIENCE:        optional('JWT_AUDIENCE', 'news-intelligence-client'),

  // OpenAI
  OPENAI_API_KEY:   optional('OPENAI_API_KEY', ''),
  OPENAI_MODEL:     optional('OPENAI_MODEL', 'gpt-4o-mini'),
  OPENAI_MAX_TOKENS: optionalInt('OPENAI_MAX_TOKENS', 2048),
  OPENAI_TEMPERATURE: optionalFloat('OPENAI_TEMPERATURE', 0.7),

  // Redis
  REDIS_URL:      optional('REDIS_URL', 'redis://localhost:6379'),
  REDIS_PASSWORD: optional('REDIS_PASSWORD', ''),
  REDIS_TTL_DEFAULT: optionalInt('REDIS_TTL_DEFAULT', 300),

  // NewsData.io
  NEWSDATA_API_KEY:       optional('NEWSDATA_API_KEY', ''),
  NEWSDATA_BASE_URL:      optional('NEWSDATA_BASE_URL', 'https://newsdata.io/api/1'),
  NEWSDATA_TIMEOUT_MS:    optionalInt('NEWSDATA_TIMEOUT_MS', 15_000),
  NEWSDATA_MAX_RETRIES:   optionalInt('NEWSDATA_MAX_RETRIES', 3),
  NEWSDATA_RETRY_DELAY_MS:optionalInt('NEWSDATA_RETRY_DELAY_MS', 1_000),
  NEWSDATA_CONCURRENCY:   optionalInt('NEWSDATA_CONCURRENCY', 3),
  NEWSDATA_TARGET_COUNT:  optionalInt('NEWSDATA_TARGET_COUNT', 200),
  NEWSDATA_BATCH_SIZE:    optionalInt('NEWSDATA_BATCH_SIZE', 10),
  // Legacy NewsAPI (kept for RSS fallback)
  NEWS_API_KEY:      optional('NEWS_API_KEY', ''),
  NEWS_INGEST_CRON:  optional('NEWS_INGEST_CRON', '*/30 * * * *'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: optionalInt('RATE_LIMIT_WINDOW_MS', 900_000),
  RATE_LIMIT_MAX:       optionalInt('RATE_LIMIT_MAX', 100),

  // CORS
  ALLOWED_ORIGINS: optional('ALLOWED_ORIGINS', 'http://localhost:3000'),

  // Logging
  LOG_LEVEL:      optional('LOG_LEVEL', 'debug'),
  LOG_FILE:       optional('LOG_FILE', 'logs/combined.log'),
  LOG_ERROR_FILE: optional('LOG_ERROR_FILE', 'logs/error.log'),

  // Pagination
  DEFAULT_PAGE_SIZE: optionalInt('DEFAULT_PAGE_SIZE', 20),
  MAX_PAGE_SIZE:     optionalInt('MAX_PAGE_SIZE', 100),

  // Feature flags
  ENABLE_AI:        optionalBool('ENABLE_AI', true),
  ENABLE_CRON:      optionalBool('ENABLE_CRON', true),
  ENABLE_CACHE:     optionalBool('ENABLE_CACHE', true),
  SOCKETIO_ENABLED: optionalBool('SOCKETIO_ENABLED', true),
} as const;

export type Env = typeof env;
