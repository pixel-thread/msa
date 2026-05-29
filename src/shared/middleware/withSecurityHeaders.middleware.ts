import { getTraceId } from '../utils';
import type { MiddlewareFn } from './chain';

export const withSecurityHeaders: MiddlewareFn = async (req, next, _event) => {
  const traceId = getTraceId(req);
  const response = await next(req);

  const headers = response.headers;
  headers.set('x-trace-id', traceId);
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'origin-when-cross-origin');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Global security headers
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // CSP
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://clerk.com https://*.clerk.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://*.clerk.com https://*.public.blob.vercel-storage.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://clerk.com https://*.clerk.com wss://ws-*.pusher.com",
    "frame-ancestors 'none'",
  ].join('; ');

  headers.set('Content-Security-Policy', csp);

  // Authenticated API responses must never be cached by browsers or proxies
  const isAuthenticatedRequest = req.headers.has('x-user-id');
  if (isAuthenticatedRequest) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    headers.set('Pragma', 'no-cache');
  }

  return response;
};
