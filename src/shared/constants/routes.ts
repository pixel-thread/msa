/**
 * Admin-only routes that require the 'admin' role.
 */
export const ADMIN_ROUTES = ["/api/v1/admin(.*)", "/admin(.*)"] as const;

/**
 * Publicly accessible web pages that do not require authentication.
 */
export const PUBLIC_ROUTES = [
  "/",
  "/menu(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forbidden",
  "/about",
  "/products(.*)",
  "/dine-in",
] as const;

/**
 * Publicly accessible API endpoints that do not require authentication.
 */
export const API_PUBLIC_ROUTES = [
  "/api/v1/products(.*)",
  "/api/v1/auth/me",
  "/api/v1/dine-in",
  "/api/v1/webhooks/clerk(.*)",
  "/api/v1/pusher/auth(.*)",
] as const;

/**
 * Private routes that require an authenticated user.
 */
export const AUTH_ROUTES = [
  "/checkout(.*)",
  "/orders(.*)",
  "/api/v1/orders(.*)",
  "/api/v1/auth/me(.*)",
] as const;
