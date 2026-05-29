import { logger } from '../logger';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@src/env';
import { MiddlewareFn } from './chain';
import { TooManyRequestsError, normalizeUnknownError } from '../errors';
import { AppErrorResponse, getTraceId } from '../utils';

const isProd = env.NODE_ENV === 'production';

/**
 * ----------------------------------------------------------------------------
 * Rate Limit Configuration
 * ----------------------------------------------------------------------------
 */

type Duration = `${number} ${'s' | 'm' | 'h' | 'd'}`;

type RouteMatch =
  | { type: 'skip' }
  | { type: 'limit'; config: { requests: number; window: Duration } };

const GLOBAL_LIMIT: { requests: number; window: Duration } = {
  requests: 20,
  window: '1 s',
};

const routeLimits: Record<string, { requests: number; window: Duration } | 'skip'> = {
  '/api/auth/*': { requests: 20, window: '1 s' },
  '/health': 'skip',
  '/favicon.ico': 'skip',
  '/api/*': GLOBAL_LIMIT,
  '/*': 'skip',
};

/**
 * ----------------------------------------------------------------------------
 * Route Matching
 * ----------------------------------------------------------------------------
 */

const matchRoute = (pathname: string): RouteMatch => {
  for (const [pattern, config] of Object.entries(routeLimits)) {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1);
      if (pathname.startsWith(prefix)) {
        return config === 'skip' ? { type: 'skip' } : { type: 'limit', config };
      }
    } else if (pathname === pattern) {
      return config === 'skip' ? { type: 'skip' } : { type: 'limit', config };
    }
  }
  return { type: 'limit', config: GLOBAL_LIMIT };
};

/**
 * ----------------------------------------------------------------------------
 * Redis / Upstash Singleton
 * ----------------------------------------------------------------------------
 */

const redis = isProd
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const limiterCache = new Map<string, Ratelimit>();

const getLimiter = (config: { requests: number; window: Duration }): Ratelimit | null => {
  if (!isProd || !redis) return null;

  const key = `${config.requests}:${config.window}`;

  if (!limiterCache.has(key)) {
    limiterCache.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.requests, config.window),
        analytics: true,
        prefix: `ratelimit:${key}`,
      }),
    );
  }

  return limiterCache.get(key)!;
};

/**
 * ----------------------------------------------------------------------------
 * Local Development Store
 * ----------------------------------------------------------------------------
 */

type LocalRecord = {
  count: number;
  reset: number;
};

const localStore = new Map<string, LocalRecord>();

if (!isProd) {
  setInterval(() => {
    const now = Date.now();

    for (const [key, value] of localStore.entries()) {
      if (now > value.reset) {
        localStore.delete(key);
      }
    }
  }, 60_000);
}

/**
 * ----------------------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------------------
 */

const WINDOW_MS = 60_000;

const getClientIp = (request: Request): string => {
  const cfIp = request.headers.get('cf-connecting-ip');

  if (cfIp) {
    return cfIp.trim();
  }

  const realIp = request.headers.get('x-real-ip');

  if (realIp) {
    return realIp.trim();
  }

  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  return 'unknown';
};

const checkLocalRateLimit = (
  identifier: string,
  config: { requests: number; window: Duration },
) => {
  const now = Date.now();

  let record = localStore.get(identifier);

  if (!record || now > record.reset) {
    record = {
      count: 0,
      reset: now + WINDOW_MS,
    };
  }

  record.count += 1;

  localStore.set(identifier, record);

  return {
    success: record.count <= config.requests,
    limit: config.requests,
    remaining: Math.max(0, config.requests - record.count),
    reset: record.reset,
  };
};

const checkRateLimit = async (
  identifier: string,
  config: { requests: number; window: Duration },
) => {
  if (!isProd || !redis) {
    return checkLocalRateLimit(identifier, config);
  }

  try {
    const limiter = getLimiter(config);

    if (!limiter) {
      return checkLocalRateLimit(identifier, config);
    }

    return await limiter.limit(identifier);
  } catch (error) {
    logger.error('Rate limiter unavailable', {
      error,
      identifier,
    });

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now() + WINDOW_MS,
    };
  }
};

/**
 * ----------------------------------------------------------------------------
 * Middleware
 * ----------------------------------------------------------------------------
 */

export const withRateLimiting: MiddlewareFn = async (request, next) => {
  const traceId = getTraceId(request);

  try {
    const url = new URL(request.url);

    const match = matchRoute(url.pathname);

    if (match.type === 'skip') {
      return await next(request);
    }

    const clientIp = getClientIp(request);

    const identifier = `ip:${clientIp}`;

    const result = await checkRateLimit(identifier, match.config);

    if (!result.success) {
      logger.warn('Rate limit exceeded', {
        identifier,
        traceId,
        route: url.pathname,
      });

      throw new TooManyRequestsError('Too many requests. Please try again later.');
    }

    const response = await next(request);

    response.headers.set('RateLimit-Limit', String(result.limit));

    response.headers.set('RateLimit-Remaining', String(result.remaining));

    response.headers.set('RateLimit-Reset', String(Math.ceil(result.reset / 1000)));

    response.headers.set(
      'Retry-After',
      String(Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))),
    );

    return response;
  } catch (error) {
    const appError = normalizeUnknownError(error);

    return AppErrorResponse(appError, traceId);
  }
};
