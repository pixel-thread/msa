import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@src/env';
import { TooManyRequestsError } from '@src/shared/errors';

let ratelimit: Ratelimit | null = null;

function getRatelimiter() {
  if (!ratelimit) {
    try {
      const redis = new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      });
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '60 s'),
        analytics: true,
      });
    } catch {
      ratelimit = null;
    }
  }
  return ratelimit;
}

export async function rateLimiter(req: Request, _res: Response, next: NextFunction) {
  const limiter = getRatelimiter();
  if (!limiter) return next();

  const identifier = req.ip || req.headers['x-forwarded-for'] as string || 'anonymous';
  const result = await limiter.limit(identifier);

  if (!result.success) {
    return next(new TooManyRequestsError('Too many requests. Please try again later.'));
  }

  next();
}
