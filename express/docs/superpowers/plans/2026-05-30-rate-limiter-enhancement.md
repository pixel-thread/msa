# Rate Limiter Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the rate-limiting system to support both global and route-specific limits using Upstash Redis.

**Architecture:** Consolidate rate-limiting logic into `src/middleware/rate-limiter.ts`. Use a factory function to instantiate `@upstash/ratelimit` clients and provide both a global middleware and a higher-order function for route-specific limits.

**Tech Stack:** Express, @upstash/ratelimit, @upstash/redis, TypeScript, Jest.

---

### Task 1: Create Unit Tests for Rate Limiter Middleware

**Files:**
- Create: `src/__tests__/middleware/rate-limiter.test.ts`

- [x] **Step 1: Write the failing tests**
Write tests for the factory function, global middleware, and route-specific middleware. Mock `@upstash/ratelimit` to return success/failure on demand.

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { rateLimiter, routeRateLimiter, createRateLimiter } from '@src/middleware/rate-limiter';
import { TooManyRequestsError } from '@src/shared/errors';
import { Ratelimit } from '@upstash/ratelimit';

jest.mock('@upstash/ratelimit');
jest.mock('@upstash/redis');

describe('Rate Limiter Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { ip: '127.0.0.1', headers: {} };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createRateLimiter', () => {
    it('should return a Ratelimit instance', () => {
      const limiter = createRateLimiter(10, '10 s');
      expect(limiter).toBeDefined();
      expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(10, '10 s');
    });
  });

  describe('rateLimiter (global)', () => {
    it('should call next() if rate limit is not exceeded', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ success: true });
      // @ts-ignore
      Ratelimit.prototype.limit = mockLimit;

      await rateLimiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next(TooManyRequestsError) if rate limit is exceeded', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ success: false });
      // @ts-ignore
      Ratelimit.prototype.limit = mockLimit;

      await rateLimiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(TooManyRequestsError));
    });
  });

  describe('routeRateLimiter', () => {
    it('should return a middleware that limits specific routes', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ success: false });
      // @ts-ignore
      Ratelimit.prototype.limit = mockLimit;

      const specificLimiter = routeRateLimiter(5, '1 m');
      await specificLimiter(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(TooManyRequestsError));
      expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(5, '1 m');
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails**
Run: `npm test src/__tests__/middleware/rate-limiter.test.ts`
Expected: FAIL (functions not exported yet or failing assertions)

- [x] **Step 3: Commit**
```bash
git add src/__tests__/middleware/rate-limiter.test.ts
git commit -m "test: add rate limiter middleware unit tests"
```

### Task 2: Implement createRateLimiter Factory

**Files:**
- Modify: `src/middleware/rate-limiter.ts`

- [x] **Step 1: Implement createRateLimiter**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@src/env';

export function createRateLimiter(limit: number, window: any) {
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
  });
}
```

- [x] **Step 2: Run tests**
Run: `npm test src/__tests__/middleware/rate-limiter.test.ts`
Expected: `createRateLimiter` tests PASS.

- [x] **Step 3: Commit**
```bash
git add src/middleware/rate-limiter.ts
git commit -m "feat: implement createRateLimiter factory"
```

### Task 3: Refactor Global rateLimiter and Implement routeRateLimiter

**Files:**
- Modify: `src/middleware/rate-limiter.ts`

- [ ] **Step 1: Refactor rateLimiter and Implement routeRateLimiter**
```typescript
import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '@src/shared/errors';

// Global rate limiter instance
const globalLimiter = createRateLimiter(100, '60 s');

export async function rateLimiter(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const identifier =
    req.ip ||
    (req.headers['x-forwarded-for'] as string) ||
    'anonymous';

  const result = await globalLimiter.limit(identifier);

  if (!result.success) {
    return next(
      new TooManyRequestsError('Too many requests. Please try again later.'),
    );
  }

  next();
}

export function routeRateLimiter(limit: number, window: any) {
  const limiter = createRateLimiter(limit, window);

  return async (req: Request, _res: Response, next: NextFunction) => {
    const identifier =
      req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      'anonymous';

    const result = await limiter.limit(identifier);

    if (!result.success) {
      return next(
        new TooManyRequestsError(
          `Rate limit exceeded for this endpoint`,
        ),
      );
    }

    next();
  };
}
```

- [ ] **Step 2: Run tests**
Run: `npm test src/__tests__/middleware/rate-limiter.test.ts`
Expected: ALL tests in `rate-limiter.test.ts` PASS.

- [ ] **Step 3: Commit**
```bash
git add src/middleware/rate-limiter.ts
git commit -m "feat: enhance rate limiter with global and route-specific options"
```

### Task 4: Final Verification and Cleanup

- [ ] **Step 1: Run all tests to ensure no regressions**
Run: `npm test`
Expected: ALL tests pass.

- [ ] **Step 2: Remove the temporary test file if desired (optional)**
I'll keep it as it's a good practice.
