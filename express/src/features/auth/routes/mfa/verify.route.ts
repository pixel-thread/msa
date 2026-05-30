import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { z } from 'zod';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { env } from '@src/env';

import { hashToken } from '@src/shared/lib/password';

import { TooManyRequestsError, UnauthorizedError } from '@src/shared/errors';

import { updateMember } from '@src/features/members/services/updateMember';

import { getVerificationCodeFirst } from '@src/features/auth/services/get-verification-code-first';
import { updateVerificationCode } from '@src/features/auth/services/update-verification-code';

/** Schema for verifying MFA — expects a 6-digit code. */
const VerifyMfaSchema = z.object({ code: z.string().length(6, 'Code must be 6 digits') });

/**
 * POST /api/auth/mfa/verify — Confirm MFA setup by submitting the verification code
 * Auth: auth middleware required
 *
 * Validates the OTP code submitted by the user, checks expiration and attempt
 * limits, then enables MFA on the user's account. Prevents brute-force attacks
 * by tracking and limiting verification attempts.
 */
export const postMfaVerify: RequestHandler[] = [
  validate({ body: VerifyMfaSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const userId = req.userId as string;
    logger.info({ traceId, userId }, 'POST /api/auth/mfa/verify - Request started');
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { code } = req.body;
    const hashedCode = hashToken(code);

    // ---- Fetch the most recent unused SETUP_MFA code ----
    const verificationCode = await getVerificationCodeFirst({
      where: { userId, type: 'SETUP_MFA', expiresAt: { gt: new Date() }, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationCode) throw new UnauthorizedError('Invalid or expired verification code');

    // Enforce max attempts to prevent brute-force guessing
    if (verificationCode.attempts >= env.OTP_MAX_ATTEMPTS) {
      throw new TooManyRequestsError('Too many attempts. Please request a new code');
    }

    // Increment attempt counter on mismatch
    if (verificationCode.code !== hashedCode) {
      await updateVerificationCode({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedError('Invalid verification code');
    }

    // ---- Mark code as used and enable MFA ----
    await updateVerificationCode({
      where: { id: verificationCode.id },
      data: { usedAt: new Date() },
    });
    await updateMember({ where: { id: userId }, data: { mfaEnabled: true } });

    logger.info({ traceId, userId }, 'POST /api/auth/mfa/verify - Success');
    return success(res, { message: 'MFA enabled successfully', data: { mfaEnabled: true } });
  }),
];
