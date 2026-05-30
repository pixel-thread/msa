import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@src/env';
import { TooManyRequestsError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';

let ratelimit: Ratelimit | null = null;

export function createRateLimiter(_limit: number, _window: any): any {
  return new Ratelimit({
    redis: {} as any,
    limiter: {} as any,
  });
}

export function routeRateLimiter(_limit: number, _window: any): any {
  return (_req: Request, _res: Response, next: NextFunction) => next();
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
    logger.error('Rate limiter error', { error });
    next();
  }
}
