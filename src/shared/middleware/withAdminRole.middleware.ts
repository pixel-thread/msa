import type { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

import { normalizeUnknownError } from "~/shared/errors";
import { AppErrorResponse, getTraceId } from "~/shared/utils";
import type { MiddlewareFn } from "./chain";
import { handleUnauthorized } from "./handle-unauthorized";
import { isAdminRoute, isPublicRoute } from "./route-matchers";

export const withAdminRole: MiddlewareFn = (req, next, event) => {
  return clerkMiddleware(async (auth, request) => {
    const traceId = getTraceId(request);

    // 1. Skip Auth for defined Public Routes
    if (isPublicRoute(request)) {
      return next(request);
    }

    const { orgRole } = await auth();

    const isAdmin = orgRole === "org:admin";

    try {
      if (!isAdmin && isAdminRoute(req)) {
        return handleUnauthorized(req, "/forbidden");
      }

      return next(request);
    } catch (error) {
      const appError = normalizeUnknownError(error);
      return AppErrorResponse(appError, traceId);
    }
  })(req, event) as Promise<NextResponse>;
};
