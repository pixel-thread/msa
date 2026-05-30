import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express route handler and forwards errors to Express error middleware.
 *
 * This prevents the need for try/catch in every controller.
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
