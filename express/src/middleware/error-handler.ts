import { Request, Response, NextFunction } from 'express';
import { AppError, normalizeUnknownError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const traceId = (req.traceId as string) || 'unknown';
  const appError = normalizeUnknownError(err, traceId);

  if (!(err instanceof AppError)) {
    logger.error({ traceId, error: err }, 'Unhandled error');
  }

  const status = appError.statusCode || 500;
  const message = appError.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
    error: appError.details || undefined,
    traceId,
    timestamp: new Date().toISOString(),
  });
}
