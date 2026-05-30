import { Request, Response } from 'express';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError } from '@src/shared/errors';
import { getUser, updateUser } from '@src/features/user/services';
import { logger } from '@src/shared/logger';

export const toggleMfa = [
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId }, 'POST /api/user/mfa - Request started');

    const userId = req.headers['x-user-id'] as string;
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