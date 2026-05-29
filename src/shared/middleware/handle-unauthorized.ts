import { NextResponse, type NextRequest } from 'next/server';

import { ErrorResponse } from '../utils';

/**
 * Handles unauthorized requests within the middleware chain.
 *
 * Production-ready features:
 * 1. Differentiates between API and Page requests.
 * 2. API: Returns a standardized JSON ErrorResponse with a 401 status.
 * 3. Pages: Redirects to /sign-in with a 'redirect_url' parameter for post-login return.
 *
 * @param req - The incoming NextRequest
 */
export async function handleUnauthorized(req: NextRequest, url?: string) {
  const { pathname, search } = req.nextUrl;

  // API requests get a JSON response
  if (pathname.startsWith('/api/')) {
    return ErrorResponse({
      message: 'Authentication required to access this resource',
      status: 401,
      code: 'UNAUTHORIZED',
    });
  }

  // Page requests get redirected to sign-in
  const signInUrl = new URL(url || '/sign-in', req.url);

  // Add redirect_url for better UX
  const redirectUrl = `${pathname}${search}`;

  if (redirectUrl !== '/') {
    signInUrl.searchParams.set('redirect_url', redirectUrl);
  }

  return NextResponse.redirect(signInUrl);
}
