import { logger } from "../logger";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@src/env";
import { MiddlewareFn } from "./chain";
import { TooManyRequestsError, normalizeUnknownError } from "../errors";
import { AppErrorResponse, getTraceId } from "../utils";

const isProd = env.NODE_ENV === "production";

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

const ratelimit = isProd
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "ratelimit:v1",
    })
  : null;

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

// Cleanup expired local records every minute
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
const LOCAL_LIMIT = 100;

const getClientIp = (request: Request): string => {
  /**
   * IMPORTANT:
   * Only trust headers injected by your infrastructure/CDN.
   *
   * Examples:
   * - Cloudflare: cf-connecting-ip
   * - Vercel: x-forwarded-for
   * - Nginx: x-real-ip
   */

  const cfIp = request.headers.get("cf-connecting-ip");

  if (cfIp) {
    return cfIp.trim();
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return "unknown";
};

const checkLocalRateLimit = (identifier: string) => {
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
    success: record.count <= LOCAL_LIMIT,
    limit: LOCAL_LIMIT,
    remaining: Math.max(0, LOCAL_LIMIT - record.count),
    reset: record.reset,
  };
};

const checkRateLimit = async (identifier: string) => {
  /**
   * Production: Upstash Redis
   * Development: In-memory simulation
   */

  if (!isProd || !ratelimit) {
    return checkLocalRateLimit(identifier);
  }

  try {
    return await ratelimit.limit(identifier);
  } catch (error) {
    /**
     * FAIL-OPEN STRATEGY
     *
     * If Upstash is unavailable:
     * - allow request
     * - log incident
     *
     * Prevents total API outage.
     */

    logger.error("Rate limiter unavailable", {
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
    /**
     * ----------------------------------------------------------------------------
     * Skip Rate Limiting For Certain Routes
     * ----------------------------------------------------------------------------
     */

    const url = new URL(request.url);

    const skippedPaths = ["/health", "/favicon.ico"];

    if (skippedPaths.includes(url.pathname)) {
      return await next(request);
    }

    /**
     * ----------------------------------------------------------------------------
     * Resolve Identifier
     * ----------------------------------------------------------------------------
     *
     * Prefer authenticated user IDs when available.
     * Fallback to IP address.
     */

    const clientIp = getClientIp(request);

    // Example:
    // const userId = request.user?.id;

    // const identifier = userId
    //   ? `user:${userId}`
    //   : `ip:${clientIp}`;

    const identifier = `ip:${clientIp}`;

    /**
     * ----------------------------------------------------------------------------
     * Apply Rate Limit
     * ----------------------------------------------------------------------------
     */

    const result = await checkRateLimit(identifier);

    if (!result.success) {
      logger.warn("Rate limit exceeded", {
        identifier,
        traceId,
      });

      throw new TooManyRequestsError(
        "Too many requests. Please try again later.",
      );
    }

    /**
     * ----------------------------------------------------------------------------
     * Continue Middleware Chain
     * ----------------------------------------------------------------------------
     */

    const response = await next(request);

    /**
     * ----------------------------------------------------------------------------
     * Standard Rate Limit Headers
     * ----------------------------------------------------------------------------
     */

    response.headers.set("RateLimit-Limit", String(result.limit));

    response.headers.set("RateLimit-Remaining", String(result.remaining));

    response.headers.set(
      "RateLimit-Reset",
      String(Math.ceil(result.reset / 1000)),
    );

    response.headers.set(
      "Retry-After",
      String(Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))),
    );

    return response;
  } catch (error) {
    const appError = normalizeUnknownError(error);

    return AppErrorResponse(appError, traceId);
  }
};
