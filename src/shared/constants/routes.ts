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
  "/forgot-password(.*)",
  "/reset-password(.*)",
  "/forbidden",
] as const;

/**
 * Publicly accessible API endpoints that do not require authentication.
 */
export const API_PUBLIC_ROUTES = [
  "/api/health(.*)",
  "/api/docs(.*)",
  "/api/auth/sign-up(.*)",
  "/api/auth/sign-in(.*)",
  "/api/auth/forgot-password(.*)",
  "/api/auth/reset-password(.*)",
] as const;

/**
 * Private routes that require an authenticated user.
 */
export const AUTH_ROUTES = ["/dashboard(.*)", "/settings(.*)", "/profile(.*)"] as const;