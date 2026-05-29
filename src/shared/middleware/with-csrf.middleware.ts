import { ForbiddenError, normalizeUnknownError } from '@src/shared/errors';
import { generateCsrfToken, verifyCsrfToken } from '../lib/csrf';
import type { MiddlewareFn } from './chain';
import { env } from '@src/env';
import { AppErrorResponse, getTraceId } from '../utils';
import { logger } from '../logger';
import { cookies } from 'next/headers';

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
 **/

export const withCsrf: MiddlewareFn = async (request, next) => {
  try {
    const method = request.method.toUpperCase();
    const pathname = request.nextUrl.pathname;
    const isPublicPath = pathname.startsWith('/api/auth');
    const authHeader = request.headers.get('authorization');
    const clientType = request.headers.get('x-client-type');
    const traceId = getTraceId(request);

    if (isPublicPath || authHeader?.startsWith('Bearer ') || clientType === 'mobile') {
      return next(request);
    }

    // SAFE METHODS
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const response = await next(request);

      const token = generateCsrfToken();

      response.cookies.set('csrf-token', token, {
        httpOnly: false,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    // MUTATING METHODS
    const csrfCookie = request.cookies.get('csrf-token')?.value;
    const csrfHeader = request.headers.get('x-csrf-token');

    if (!csrfCookie || !csrfHeader || !verifyCsrfToken(csrfHeader, csrfCookie)) {
      logger.info('Invalid or missing CSRF token', {
        traceId,
        cookies: !!csrfCookie,
        hearder: !!csrfHeader,
      });
      throw new ForbiddenError('Invalid or missing CSRF token');
    }

    return next(request);
  } catch (error) {
    const traceId = getTraceId(request);
    const apperror = normalizeUnknownError(error);
    return AppErrorResponse(apperror, traceId);
  }
};
