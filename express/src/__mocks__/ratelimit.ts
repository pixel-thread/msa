import { jest } from '@jest/globals';

export const Ratelimit = jest.fn().mockImplementation(() => {
  return {
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    }),
  };
});

(Ratelimit as any).slidingWindow = jest.fn();
