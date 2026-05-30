import { Request, NextFunction, Response } from 'express';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError } from '@src/shared/errors';
import { getUniqueUser } from '@src/shared/services/user/get-unique-user';
import { getAuthCachedUser, cacheAuthUser } from '@src/features/auth/lib/cache';
import { env } from '@src/env';
import { logger } from '@src/shared/logger';

export const getMe = async (req: Request, res: Response, _next: NextFunction) => {
  const traceId = (req.traceId as string) || '';
  const userId = req.userId as string;
  logger.info({ traceId, userId }, 'GET /api/auth/me - Request started');

  if (!userId) throw new UnauthorizedError('Unauthorized');

  if (env.NODE_ENV === 'production') {
    const cachedUser = await getAuthCachedUser(userId);
    if (cachedUser) {
      logger.info({ traceId, userId }, 'GET /api/auth/me - Success (cached)');
      return success(res, { message: 'User fetched successfully', data: cachedUser });
    }
  }

  const user = await getUniqueUser({ where: { id: userId } });
  if (!user || user.status !== 'ACTIVE') throw new UnauthorizedError('User not found or inactive');

  if (env.NODE_ENV === 'production') await cacheAuthUser(userId, user);

  logger.info({ traceId, userId }, 'GET /api/auth/me - Success');
  return success(res, { message: 'User fetched successfully', data: user });
};
