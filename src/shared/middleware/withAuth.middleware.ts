import { MiddlewareFn } from './chain';
import { AppErrorResponse, getTraceId } from '../utils';
import { isApiPublicRoute, isPublicRoute } from './route-matchers';
import { normalizeUnknownError, UnauthorizedError } from '../errors';
import { verifyAccessToken } from '../lib';
import { NextRequest } from 'next/server';

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

    accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      const authHeader = request.headers.get('authorization');

      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.split(' ')[1];
      }
    }

    if (!accessToken) {
      throw new UnauthorizedError('Authentication required');
    }

    const payload = await verifyAccessToken(accessToken);

    // clone headers
    const requestHeaders = new Headers(request.headers);

    // remove spoofed header
    requestHeaders.delete('x-user-id');

    // inject trusted identity
    requestHeaders.set('x-user-id', payload.sub);

    const newRequest = new NextRequest(request, { headers: requestHeaders });
    return next(newRequest);
  } catch (error) {
    const apperror = normalizeUnknownError(error);

    return AppErrorResponse(apperror, traceId);
  }
};
