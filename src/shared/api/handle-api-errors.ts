import { NextRequest } from 'next/server';

import { AppError, normalizeUnknownError } from '@src/shared/errors';
import { AppErrorResponse, getTraceId } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';

type RouteHandler<TContext> = (request: NextRequest, context: TContext) => Promise<Response>;

export function handleApiErrors<TContext>(handler: RouteHandler<TContext>) {
  return async (request: NextRequest, context: TContext) => {
    const traceId = getTraceId(request);

    try {
      return await handler(request, context);
    } catch (error) {
      const appError = normalizeUnknownError(error, traceId);
      if (!(error instanceof AppError)) {
        logger.error(
          {
            traceId,
            error,
          },
          'API ERROR',
        );
      }

      return AppErrorResponse(appError, traceId);
    }
  };
}
