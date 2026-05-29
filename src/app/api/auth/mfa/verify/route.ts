import { z } from 'zod';

import { withValidation } from '@src/shared/api';
import { hashToken } from '@src/shared/lib/password';
import { env } from '@src/env';
import { TooManyRequestsError, UnauthorizedError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { getVerificationCodeFirst } from '@src/features/auth/services/get-verification-code-first';
import { updateVerificationCode } from '@src/features/auth/services/update-verification-code';
import { updateMember } from '@src/features/members/services/updateMember';
import { logger } from '@src/shared/logger/server';

const VerifyMfaSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

type VerifyMfaBody = z.infer<typeof VerifyMfaSchema>;

export const POST = withValidation(
  { body: VerifyMfaSchema },
  async (request, _ctx, { body, traceId }) => {
    const userId = request.headers.get('x-user-id');
    logger.info({ traceId, userId }, 'POST /api/auth/mfa/verify - Request started');

    if (!userId) {
      logger.error({ traceId }, 'POST /api/auth/mfa/verify - Unauthorized (missing x-user-id)');
      throw new UnauthorizedError('Unauthorized');
    }

    const { code } = body as VerifyMfaBody;

    const hashedCode = hashToken(code);

    const verificationCode = await getVerificationCodeFirst({
      where: {
        userId,
        type: 'SETUP_MFA',
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationCode) {
      logger.error(
        { traceId, userId },
        'POST /api/auth/mfa/verify - Invalid or expired verification code',
      );
      throw new UnauthorizedError('Invalid or expired verification code');
    }

    if (verificationCode.attempts >= env.OTP_MAX_ATTEMPTS) {
      logger.error(
        { traceId, userId, verificationCodeId: verificationCode.id },
        'POST /api/auth/mfa/verify - Too many attempts',
      );
      throw new TooManyRequestsError('Too many attempts. Please request a new code');
    }

    if (verificationCode.code !== hashedCode) {
      await updateVerificationCode({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } },
      });

      logger.error(
        { traceId, userId, verificationCodeId: verificationCode.id },
        'POST /api/auth/mfa/verify - Invalid verification code input',
      );
      throw new UnauthorizedError('Invalid verification code');
    }

    await updateVerificationCode({
      where: { id: verificationCode.id },
      data: { usedAt: new Date() },
    });

    await updateMember({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    logger.info({ traceId, userId }, 'POST /api/auth/mfa/verify - Success');

    return SuccessResponse({
      message: 'MFA enabled successfully',
      data: { mfaEnabled: true },
    });
  },
);
