import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { rateLimiter, routeRateLimiter, createRateLimiter, _resetRatelimiter } from '@src/middleware/rate-limiter';
import { TooManyRequestsError } from '@src/shared/errors';
import { Ratelimit } from '@upstash/ratelimit';

// Correct mocking for Task 1
const mockLimit = jest.fn();
// @ts-ignore
Ratelimit.mockImplementation(() => ({
  limit: mockLimit,
}));

describe('Rate Limiter Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { ip: '127.0.0.1', headers: {} };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
    _resetRatelimiter();
  });

  describe('createRateLimiter', () => {
    it('should return a Ratelimit instance', () => {
      const limiter = createRateLimiter(10, '10 s');
      expect(limiter).not.toBeNull();
      expect(limiter.limit).toBeDefined();
    });
  });

  describe('rateLimiter (global)', () => {
    it('should call next() if rate limit is not exceeded', async () => {
      mockLimit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now()
      });

      await rateLimiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next(TooManyRequestsError) if rate limit is exceeded', async () => {
      mockLimit.mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now()
      });

      await rateLimiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(TooManyRequestsError));
    });

    it('should use x-forwarded-for if req.ip is missing', async () => {
      req.ip = undefined;
      req.headers = { 'x-forwarded-for': '192.168.1.1' };
      mockLimit.mockResolvedValue({ success: true });

      await rateLimiter(req as Request, res as Response, next);
      expect(mockLimit).toHaveBeenCalledWith('192.168.1.1');
      expect(next).toHaveBeenCalledWith();
    });

    it('should fallback to anonymous if both ip and x-forwarded-for are missing', async () => {
      req.ip = undefined;
      req.headers = {};
      mockLimit.mockResolvedValue({ success: true });

      await rateLimiter(req as Request, res as Response, next);
      expect(mockLimit).toHaveBeenCalledWith('anonymous');
      expect(next).toHaveBeenCalledWith();
    });

    it('should fail open (call next()) if limiter fails (e.g., Redis down)', async () => {
      mockLimit.mockRejectedValue(new Error('Redis down'));

      await rateLimiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('routeRateLimiter', () => {
    it('should return a functional rate limiter middleware', async () => {
      const specificLimiter = routeRateLimiter(5, '1 m');
      
      mockLimit.mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now()
      });

      await specificLimiter(req as Request, res as Response, next);

      expect(mockLimit).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(TooManyRequestsError));
    });
  });
});
