import { logger } from '@src/shared/logger/server';
import { redis } from './redis';

export interface CacheClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

export const cacheClient: CacheClient = {
  async get<T>(key: string): Promise<T | null> {
    try {
      return (await redis.get(key)) as T | null;
    } catch (error) {
      logger.error(
        {
          key,
          error,
        },
        'Cache get failed',
      );

      return null;
    }
  },
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      // important: allow ttl=0 if needed
      if (ttlSeconds !== undefined) {
        await redis.set(key, serialized, {
          ex: ttlSeconds,
        });
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      logger.error(
        {
          key,
          ...serializeError(error),
        },
        'Cache set failed',
      );
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(
        {
          key,
          ...serializeError(error),
        },
        'Cache del failed',
      );
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';

      do {
        const [nextCursor, keys] = await redis.scan(cursor, {
          match: pattern,
          count: 100,
        });

        cursor = nextCursor;

        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      logger.error(
        {
          pattern,
          ...serializeError(error),
        },
        'Cache delPattern failed',
      );
    }
  },
};
