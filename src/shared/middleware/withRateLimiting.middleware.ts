import { logger } from "../logger";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@src/env";
import { MiddlewareFn } from "./chain";
import { TooManyRequestsError, normalizeUnknownError } from "../errors";
import { AppErrorResponse, getTraceId } from "../utils";

const isProd = process.env.NODE_ENV === "production";

let redis: Redis | null = null;

let ratelimit: Ratelimit | null = null;

if (isProd) {
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  });
}

// In-memory store for local development/testing to save Upstash limits
const localStore = new Map<string, { count: number; reset: number }>();

const checkRateLimit = async (ip: string) => {
  if (isProd && ratelimit) {
    return await ratelimit.limit(ip);
  }

  // Local Development Simulation (100 req / 10s Fixed Window)
  const now = Date.now();
  const windowMs = 10000;
  const limit = 1000;

  let record = localStore.get(ip);
  if (!record || now > record.reset) {
    record = { count: 0, reset: now + windowMs };
  }

  record.count += 1;
  localStore.set(ip, record);

  return {
    success: record.count <= limit,
    limit,
    remaining: Math.max(0, limit - record.count),
    reset: record.reset,
  };
};

export const withRateLimiting: MiddlewareFn = async (request, next) => {
  const traceId = getTraceId(request);

  try {
    // 1. Resolve Secure IP
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIpHeader = request.headers.get("x-real-ip");

    const clientIp =
      (forwardedFor ? forwardedFor.split(",")[0].trim() : null) ||
      realIpHeader ||
      "127.0.0.1";

    // 2. Anti-Spoofing Anomaly Detection
    if (forwardedFor && realIpHeader) {
      const spoofedIp = forwardedFor.split(",")[0].trim();
      if (spoofedIp !== realIpHeader && realIpHeader !== "127.0.0.1") {
        logger.warn(
          `[RATE-LIMIT] IP Spoofing Anomaly: X-Forwarded-For (${spoofedIp}) does not match X-Real-IP (${realIpHeader})`,
        );
      }
    }

    // 3. Apply Environment-Aware Rate Limit
    const result = await checkRateLimit(clientIp);

    if (!result.success) {
      logger.warn(`[RATE-LIMIT] Threshold exceeded for IP: ${clientIp}`);
      throw new TooManyRequestsError("Too many requests");
    }

    // 4. Continue the middleware chain
    const response = await next(request);

    // 5. Inject rate limit metadata
    response.headers.set("X-RateLimit-Limit", String(result.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.reset));

    return response;
  } catch (error) {
    const appError = normalizeUnknownError(error);
    return AppErrorResponse(appError, traceId);
  }
};
