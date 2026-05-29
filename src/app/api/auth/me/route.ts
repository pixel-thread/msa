import { SuccessResponse } from '@src/shared/utils';
import { UnauthorizedError } from '@src/shared/errors';
import { getUniqueUser } from '@src/shared/services/user/get-unique-user';
import { getAuthCachedUser, cacheAuthUser } from '@src/features/auth/lib/cache';
import { withAssociation } from '@src/shared/api/with-association';
import { env } from '@src/env';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation({}, async (_association, { traceId }, req) => {
  const userId = req.headers.get('x-user-id');
  logger.info({ traceId, userId }, 'GET /api/auth/me - Request started');

  if (!userId) {
    logger.error({ traceId }, 'GET /api/auth/me - Unauthorized (missing x-user-id)');
    throw new UnauthorizedError('Unauthorized');
  }

  if (env.NODE_ENV === 'production') {
    const cachedUser = await getAuthCachedUser(userId);
    if (cachedUser) {
      logger.info({ traceId, userId }, 'GET /api/auth/me - Success (cached user returned)');
      return SuccessResponse({
        message: 'User fetched successfully',
        data: cachedUser,
      });
    }
  }

  const user = await getUniqueUser({
    where: { id: userId },
  });

  if (!user || user.status !== 'ACTIVE') {
    logger.error({ traceId, userId }, 'GET /api/auth/me - User not found or inactive');
    throw new UnauthorizedError('User not found or inactive');
  }

  if (env.NODE_ENV === 'production') {
    await cacheAuthUser(userId, user);
  }

  logger.info({ traceId, userId }, 'GET /api/auth/me - Success');

  return SuccessResponse({
    message: 'User fetched successfully',
    data: user,
  });
});
