/**
 * Admin-only routes that require the 'admin' role.
 */
export const ADMIN_ROUTES = ["/api/admin(.*)", "/admin(.*)"] as const;

/**
 * Publicly accessible web pages that do not require authentication.
 */
export const PUBLIC_ROUTES = [
  "/",
  "/docs(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forbidden",
] as const;

/**
 * Publicly accessible API endpoints that do not require authentication.
 */
export const API_PUBLIC_ROUTES = [
  "/api/health(.*)",
  "/api/webhooks/clerk(.*)",
  "/api/docs(.*)",
] as const;

/**
 * Private routes that require an authenticated user.
 */
export const AUTH_ROUTES = [] as const;
