import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import type { Duration } from '@upstash/ratelimit';
import { TooManyRequestsError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { redis } from '@lib/redis';

// Singleton Redis client

if (!redis) {
  logger.warn('Upstash Redis credentials missing. Rate limiting will be disabled.');
}

let ratelimit: Ratelimit | null = null;

export function createRateLimiter(limit: number, window: Duration) {
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
  });
}

export function routeRateLimiter(limit: number, window: Duration): RequestHandler {
  const limiter = createRateLimiter(limit, window);

  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!limiter) return next();

    try {
      const identifier = req.ip || (req.headers['x-forwarded-for'] as string) || 'anonymous';
      const result = await limiter.limit(identifier);

      if (!result.success) {
        return next(new TooManyRequestsError('Too many requests. Please try again later.'));
      }

      next();
    } catch (error) {
      logger.error({ error }, 'Route rate limiter error');
      next();
    }
  };
}

export function _resetRatelimiter() {
  ratelimit = null;
}

function getRatelimiter() {
  if (!ratelimit) {
    try {
      ratelimit = createRateLimiter(100, '60 s');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize rate limiter');
      ratelimit = null;
    }
  }
  return ratelimit;
}

export async function rateLimiter(req: Request, _res: Response, next: NextFunction) {
  const limiter = getRatelimiter();
  if (!limiter) return next();

  try {
    const identifier = req.ip || (req.headers['x-forwarded-for'] as string) || 'anonymous';
    const result = await limiter.limit(identifier);

    if (!result.success) {
      return next(new TooManyRequestsError('Too many requests. Please try again later.'));
    }

    next();
  } catch (error) {
    logger.error({ error }, 'Rate limiter error');
    next();
  }
}
