import { Request, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { verifyPassword } from '@src/shared/lib/password';
import { z } from 'zod';
import { BadRequestError, UnauthorizedError } from '@src/shared/errors';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateMember } from '@src/features/members/services/updateMember';
import { logger } from '@src/shared/logger';

const DisableMfaSchema = z.object({ password: z.string().min(1, 'Password is required') });

export const postMfaDisable = [
  validate({ body: DisableMfaSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
      const userId = req.headers['x-user-id'] as string;
      logger.info({ traceId, userId }, 'POST /api/auth/mfa/disable - Request started');
      if (!userId) throw new UnauthorizedError('Unauthorized');

      const { password } = req.body;
      const user = await findFirstMember({
        where: { id: userId },
        select: { password: true, mfaEnabled: true },
      });

      if (!user || !user.mfaEnabled) throw new BadRequestError('MFA is not enabled');
      if (!user.password) throw new BadRequestError('Please set a password first');

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) throw new UnauthorizedError('Invalid password');

      await updateMember({ where: { id: userId }, data: { mfaEnabled: false } });

      logger.info({ traceId, userId }, 'POST /api/auth/mfa/disable - Success');
      return success(res, { message: 'MFA disabled successfully', data: { mfaEnabled: false } });
  },
];
