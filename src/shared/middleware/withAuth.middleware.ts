import type { MiddlewareFn } from "./chain";

import { verifyAccessToken } from "@src/shared/lib/jwt";
import { normalizeUnknownError, UnauthorizedError } from "@src/shared/errors";
import { isApiPublicRoute, isPublicRoute } from "./route-matchers";
import { AppErrorResponse, getTraceId } from "../utils";

export const withAuth: MiddlewareFn = async (request, next) => {
  const traceId = getTraceId(request);
  try {
    if (isPublicRoute(request.nextUrl.pathname)) {
      return next(request);
    }

    if (isApiPublicRoute(request.nextUrl.pathname)) {
      return next(request);
    }

    let accessToken: string | undefined;

    // Check cookie first
    accessToken = request.cookies.get("access_token")?.value;

    // If not in cookie, check Authorization header (Bearer token)
    if (!accessToken) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        accessToken = authHeader.split(" ")[1];
      }
    }

    if (!accessToken) {
      throw new UnauthorizedError("Authentication required");
    }

    const payload = await verifyAccessToken(accessToken);

    request.headers.set("x-user-id", payload.sub);

    return next(request);
  } catch (error) {
    const apperror = normalizeUnknownError(error);
    return AppErrorResponse(apperror, traceId);
  }
};
