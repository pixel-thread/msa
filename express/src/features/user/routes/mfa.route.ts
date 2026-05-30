import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError } from '@src/shared/errors';
import { getUser, updateUser } from '@src/features/user/services';
import { logger } from '@src/shared/logger';

export const toggleMfa: RequestHandler[] = [
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'POST /api/user/mfa - Request started');

    const userId = req.userId as string;
    if (!userId) throw new UnauthorizedError('User not found');

    const user = await getUser({ id: userId });
    if (!user) throw new UnauthorizedError('User not found');

    const mfaEnabled = !user.mfaEnabled;
    await updateUser({
      where: { id: userId },
      data: { mfaEnabled },
    });

    logger.info({ traceId, userId, mfaEnabled }, 'POST /api/user/mfa - Success');

    return success(res, {
      data: { mfaEnable: mfaEnabled },
      message: 'MFA updated successfully',
    });
  },
];
