import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;

export const connectRedis = async (): Promise<void> => {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

  try {
    redisClient = createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD ?? undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.warn('Redis: Max reconnection attempts reached. Running without cache.');
            return false;
          }
          return Math.min(retries * 100, 3000);
        },
      },
    }) as RedisClientType;

    redisClient.on('error', (err) => {
      logger.warn('Redis client error (non-fatal):', err.message as string);
    });

    redisClient.on('connect', () => logger.info('✅ Redis connected'));
    redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection failed — caching disabled:', (error as Error).message);
    redisClient = null;
  }
};

export const getRedisClient = (): RedisClientType | null => redisClient;

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown, ttlSeconds = 300): Promise<void> => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Non-fatal
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch {
    // Non-fatal
  }
};

export const cacheFlushPattern = async (pattern: string): Promise<void> => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch {
    // Non-fatal
  }
};
