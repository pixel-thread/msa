import { NextRequest } from "next/server";

import { AppError, normalizeUnknownError } from "@src/shared/errors";
import { AppErrorResponse, getTraceId } from "@src/shared/utils";
import { logger } from "../logger";

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
      logger.debug("[Dev log]", { error });
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
