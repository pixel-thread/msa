import type { NextResponse } from "next/server";
import { clerkMiddleware, verifyToken } from "@clerk/nextjs/server";

import { env } from "@src/env";
import { normalizeUnknownError, UnauthorizedError } from "@src/shared/errors";
import { AppErrorResponse } from "@utils/responses";
import type { MiddlewareFn } from "./chain";
import { handleUnauthorized } from "./handle-unauthorized";
import { isApiPublicRoute, isPublicRoute } from "./route-matchers";
import { getTraceId } from "../utils";

export const withAuth: MiddlewareFn = (req, next, event) => {
  return clerkMiddleware(async (auth, request) => {
    const traceId = getTraceId(request);

    // 1. Skip Auth for defined Public Routes
    if (isPublicRoute(request)) {
      return next(request);
    }

    try {
      const authHeader = request.headers.get("Authorization");
      let userId: string | null = null;

      /* --- MODE 1: MOBILE (Bearer JWT) --- */
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        if (token) {
          try {
            const payload = await verifyToken(token, {
              secretKey: env.CLERK_SECRET_KEY,
            });

            userId = payload.sub;
          } catch {
            throw new UnauthorizedError("Invalid session token.");
          }
        }
      } else {
        /* --- MODE 2: WEB (Session Cookie) --- */
        const authData = await auth();
        userId = authData.userId;
      }

      // If user is not authenticated, check if the route is private
      if (!userId) {
        const isPublic = isPublicRoute(request) || isApiPublicRoute(request);

        if (!isPublic) {
          const isApi = request.nextUrl.pathname.startsWith("/api/");

          if (isApi) {
            throw new UnauthorizedError("Authentication required");
          }

          return handleUnauthorized(request);
        }
      }

      // Standardize Identity via x-user-id header
      if (userId) {
        request.headers.set("x-user-id", userId);
      }

      return next(request);
    } catch (error) {
      const appError = normalizeUnknownError(error);
      return AppErrorResponse(appError, traceId);
    }
  })(req, event) as Promise<NextResponse>;
};
