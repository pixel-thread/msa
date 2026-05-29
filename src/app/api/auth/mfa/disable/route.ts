import { z } from 'zod';

import { withValidation } from '@src/shared/api';
import { verifyPassword } from '@src/shared/lib/password';
import { BadRequestError, UnauthorizedError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateMember } from '@src/features/members/services/updateMember';
import { logger } from '@src/shared/logger/server';

const DisableMfaSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type DisableMfaBody = z.infer<typeof DisableMfaSchema>;

export const POST = withValidation(
  { body: DisableMfaSchema },
  async (request, _ctx, { body, traceId }) => {
    const userId = request.headers.get('x-user-id');
    logger.info({ traceId, userId }, 'POST /api/auth/mfa/disable - Request started');

    if (!userId) {
      logger.error({ traceId }, 'POST /api/auth/mfa/disable - Unauthorized (missing x-user-id)');
      throw new UnauthorizedError('Unauthorized');
    }

    const { password } = body as DisableMfaBody;

    const user = await findFirstMember({
      where: { id: userId },
      select: { password: true, mfaEnabled: true },
    });

    if (!user || !user.mfaEnabled) {
      logger.error({ traceId, userId }, 'POST /api/auth/mfa/disable - MFA is not enabled');
      throw new BadRequestError('MFA is not enabled');
    }

    if (!user.password) {
      logger.error({ traceId, userId }, 'POST /api/auth/mfa/disable - User password not set');
      throw new BadRequestError('Please set a password first');
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      logger.error({ traceId, userId }, 'POST /api/auth/mfa/disable - Invalid password');
      throw new UnauthorizedError('Invalid password');
    }

    await updateMember({
      where: { id: userId },
      data: { mfaEnabled: false },
    });

    logger.info({ traceId, userId }, 'POST /api/auth/mfa/disable - Success');

    return SuccessResponse({
      message: 'MFA disabled successfully',
      data: { mfaEnabled: false },
    });
  },
);
