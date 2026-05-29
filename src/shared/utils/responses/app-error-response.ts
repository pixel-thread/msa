import type { AppError } from '@src/shared/errors';
import { ErrorResponse } from './error-response';

export function AppErrorResponse(error: AppError, traceId: string) {
  return ErrorResponse({
    status: error.statusCode,
    code: error.code,
    message: error.message,
    details: error.details,
    traceId: traceId,
  });
}
