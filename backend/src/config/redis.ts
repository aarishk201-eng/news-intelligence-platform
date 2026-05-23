import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

export const connectRedis = async (): Promise<void> => {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

  try {
    redisClient = createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD ?? undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            return false; // Stop retrying after 5 attempts
          }
          return Math.min(retries * 100, 3000);
        },
      },
    }) as RedisClientType;

    redisClient.on('error', (err) => {
      // Only log once to avoid spamming
    });

    redisClient.on('connect', () => logger.info('✅ Redis connected'));

    await redisClient.connect();
  } catch (error) {
    logger.info('ℹ️ Redis unavailable — using in-memory cache fallback');
    redisClient = null;
  }
};

export const getRedisClient = (): RedisClientType | null => redisClient;

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (redisClient?.isOpen) {
    try {
      const data = await redisClient.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  }

  // Memory fallback
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return JSON.parse(entry.value) as T;
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds = 300): Promise<void> => {
  const serialized = JSON.stringify(value);

  if (redisClient?.isOpen) {
    try {
      await redisClient.setEx(key, ttlSeconds, serialized);
      return;
    } catch {
      // Fall through to memory
    }
  }

  // Memory fallback
  memoryCache.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

export const cacheDel = async (key: string): Promise<void> => {
  if (redisClient?.isOpen) {
    try {
      await redisClient.del(key);
    } catch {
      // Fall through
    }
  }
  memoryCache.delete(key);
};

export const cacheFlushPattern = async (pattern: string): Promise<void> => {
  if (redisClient?.isOpen) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch {
      // Fall through
    }
  }

  // Simple pattern matching for memory cache (regex-based)
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
};
