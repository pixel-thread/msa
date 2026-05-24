import { ForbiddenError } from "@src/shared/errors";
import { generateCsrfToken, verifyCsrfToken } from "../lib/csrf";
import type { MiddlewareFn } from "./chain";

/**
 * CSRF protection middleware using the double-submit cookie pattern.
 *
 * Safe methods (GET, HEAD, OPTIONS):
 *   Sets a csrf-token cookie if not already present on the request.
 *
 * State-changing methods (POST, PUT, DELETE, PATCH):
 *   Validates the X-CSRF-Token header against the csrf-token cookie value.
 *   Returns 403 Forbidden on mismatch or missing token.
 *
 * Security:
 *   - CSRF check is skipped when Authorization: Bearer header is present (non-browser / mobile client)
 *   - CSRF check is skipped when x-client-type: mobile header is set (explicit mobile flag)
 *   - Cookie is non-httpOnly (browser JS needs to read it to set the header) with SameSite=Strict
 *   - Token comparison uses constant-time verification (crypto.timingSafeEqual)
 */
export const withCsrf: MiddlewareFn = async (request, next) => {
  const method = request.method.toUpperCase();

  // Skip CSRF for non-browser clients
  const authHeader = request.headers.get("authorization");
  const clientType = request.headers.get("x-client-type");

  if (authHeader?.startsWith("Bearer ") || clientType === "mobile") {
    return next(request);
  }

  // Safe methods: set CSRF token cookie if not already present
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    const response = await next(request);

    if (!request.cookies.has("csrf-token")) {
      const token = generateCsrfToken();
      response.cookies.set("csrf-token", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60,
      });
    }

    return response;
  }

  // State-changing methods: validate CSRF token
  const csrfCookie = request.cookies.get("csrf-token")?.value;
  const csrfHeader = request.headers.get("x-csrf-token");

  if (!csrfCookie || !csrfHeader || !verifyCsrfToken(csrfHeader, csrfCookie)) {
    throw new ForbiddenError("Invalid or missing CSRF token");
  }

  return next(request);
};
