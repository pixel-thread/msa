import { AUTH_ROUTES } from '../constants';
import type { MiddlewareFn } from './chain';

import { ForbiddenError } from '@src/shared/errors';

const BLOCKED_USER_AGENTS = [
  'curl',
  'wget',
  'python',
  'scrapy',
  'axios',
  'httpclient',
  'postman',
  'insomnia',
];

export const withBotProtection: MiddlewareFn = async (request, next) => {
  const pathname = request.nextUrl.pathname;

  // Only protect sensitive routes
  const protectedRoutes = AUTH_ROUTES;

  const shouldProtect = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!shouldProtect) {
    return next(request);
  }

  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  const isBlockedAgent = BLOCKED_USER_AGENTS.some((agent) => userAgent.includes(agent));

  if (isBlockedAgent) {
    throw new ForbiddenError('Bot detected');
  }

  // Missing common browser headers
  const accept = request.headers.get('accept');
  const secFetchSite = request.headers.get('sec-fetch-site');

  if (!accept || !secFetchSite) {
    throw new ForbiddenError('Suspicious request');
  }

  return next(request);
};
