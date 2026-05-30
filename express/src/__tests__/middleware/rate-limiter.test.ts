import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
// @ts-ignore - These might not exist yet, which is expected for Task 1
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
      // @ts-ignore
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

      // @ts-ignore
      const specificLimiter = routeRateLimiter(5, '1 m');
      await specificLimiter(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(TooManyRequestsError));
      expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(5, '1 m');
    });
  });
});
