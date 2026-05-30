/**
 * Admin-only routes that require the 'admin' role.
 */
export const ADMIN_ROUTES = ['/api/admin(.*)', '/admin(.*)'] as const;

/**
 * Publicly accessible web pages that do not require authentication.
 */
export const PUBLIC_PAGE_PATH = [
  '/',
  '/docs',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/forbidden',
  '/membership-applications',
  '/*',
] as const;

/**
 * Publicly accessible API endpoints that do not require authentication.
 */
export const API_PUBLIC_ROUTES = [
  '/health',
  '/docs',
  '/auth/refresh',
  '/auth/sign-up',
  '/auth/sign-in',
  '/auth/sign-in/verify',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/payments/webhook',
  '/logs',
] as const;

/**
 * Private routes that require an authenticated user.
 */
export const AUTH_ROUTES = ['/dashboard(.*)', '/settings(.*)', '/profile(.*)'] as const;
