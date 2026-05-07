import { NextRequest } from "next/server";

import { AppError, normalizeUnknownError } from "~/shared/errors";
import { AppErrorResponse, getTraceId } from "~/shared/utils";

type RouteHandler<TContext> = (
  request: NextRequest,
  context: TContext,
) => Promise<Response>;

export function handleApiErrors<TContext>(handler: RouteHandler<TContext>) {
  return async (request: NextRequest, context: TContext) => {
    const traceId = getTraceId(request);

    try {
      return await handler(request, context);
    } catch (error) {
      const appError = normalizeUnknownError(error);
      if (!(error instanceof AppError)) {
        console.error("API ERROR", {
          traceId,
          error,
        });
      }

      return AppErrorResponse(appError, traceId);
    }
  };
}
