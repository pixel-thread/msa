import { Request, Response, RequestHandler } from 'express';

import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { env } from '@src/env';

import { UnauthorizedError } from '@src/shared/errors';

import { getUniqueUser } from '@src/shared/services/user/get-unique-user';

import { getAuthCachedUser, cacheAuthUser } from '@src/features/auth/lib/cache';

/**
 * GET /api/auth/me — Fetch the current authenticated user's profile
 * Auth: auth middleware required
 *
 * Returns the authenticated user's profile from the database. In production,
 * caches the result to reduce database load on repeated requests.
 */
export const getMe: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const traceId = (req.traceId as string) || '';
  const userId = req.userId as string;
  logger.info({ traceId, userId }, 'GET /api/auth/me - Request started');

  if (!userId) throw new UnauthorizedError('Unauthorized');

  // ---- Return cached profile in production for performance ----
  if (env.NODE_ENV === 'production') {
    const cachedUser = await getAuthCachedUser(userId);
    if (cachedUser) {
      logger.info({ traceId, userId }, 'GET /api/auth/me - Success (cached)');
      return success(res, { message: 'User fetched successfully', data: cachedUser });
    }
  }

  // ---- Fetch fresh user data from the database ----
  const user = await getUniqueUser({ where: { id: userId } });
  if (!user || user.status !== 'ACTIVE') throw new UnauthorizedError('User not found or inactive');

  // Cache the result so subsequent requests are faster
  if (env.NODE_ENV === 'production') {
    await cacheAuthUser(userId, user);
  }

  logger.info({ traceId, userId }, 'GET /api/auth/me - Success');
  return success(res, { message: 'User fetched successfully', data: user });
});
