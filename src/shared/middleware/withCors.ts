import { NextResponse } from 'next/server';

import { env } from '@src/env';
import type { MiddlewareFn } from './chain';

/**
 * withCors Middleware
 * Dynamically handles CORS based on environment configuration.
 * Uses ALLOWED_ORIGINS from env.ts for production safety.
 */
export const withCors: MiddlewareFn = async (req, next, _event) => {
  const origin = req.headers.get('origin');

  // Define base allowed origins. Always include local dev.
  const baseOrigins = ['http://localhost:3000'];

  // Combine with production origins from ENV
  const allowedOrigins = [...baseOrigins, ...(env.ALLOWED_ORIGINS ?? [])];

  // Determine if the current origin is permitted
  const isAllowed = origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'));

  // 1. Handle PREFLIGHT (OPTIONS) requests
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });

    if (origin && isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    } else if (allowedOrigins.includes('*')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-user-id, x-client-type',
    );
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

    return response;
  }

  // 2. Handle ACTUAL requests
  const response = await next(req);

  if (origin && isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (!origin && allowedOrigins.includes('*')) {
    // For non-browser requests/SDKs if * is set
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  // Common CORS headers for actual responses
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-user-id, x-client-type',
  );

  return response;
};
