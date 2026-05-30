import { RequestHandler } from 'express';

/**
 * Wraps an async Express route handler and forwards errors to Express error middleware.
 *
 * This prevents the need for try/catch in every controller.
 */

export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
