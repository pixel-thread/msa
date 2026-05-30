# Design Doc — Rate Limiter Enhancement

**Version:** 1.0.0 | **Status:** DRAFT
**Created:** 2026-05-30 | **Last Updated:** 2026-05-30

## Purpose
Enhance the existing rate-limiting system to support both global and route-specific limits using Upstash Redis. This allows for more granular control over API traffic and protects sensitive endpoints.

## Architecture
The rate-limiting logic will be consolidated in `src/middleware/rate-limiter.ts`. This file will serve as both a library for creating limiters and a provider of middleware.

### Components
1. **`createRateLimiter(limit: number, window: string)`**: A utility function to instantiate the `@upstash/ratelimit` client with a sliding window strategy and analytics enabled.
2. **`rateLimiter`**: A global middleware instance (default 100 requests per 60 seconds) to be used across the entire application.
3. **`routeRateLimiter(limit: number, window: string)`**: A higher-order function that returns a middleware function with custom limits for specific routes.

## Data Flow
1. Incoming Request -> Rate Limiter Middleware.
2. Identify user by IP or `x-forwarded-for` header.
3. Check limit against Upstash Redis.
4. If successful: `next()`.
5. If failed: Throw `TooManyRequestsError`.

## Error Handling
The middleware will use the existing `@src/shared/errors` to throw a `TooManyRequestsError` when limits are exceeded.

## Success Metrics
- Successfully limit global traffic to 100 req/60s.
- Ability to apply stricter limits (e.g., 5 req/60s) to sensitive routes like auth.
