import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { env } from '@src/env';

import { generateOTP, hashToken } from '@src/shared/lib/password';
import { sendVerificationEmail } from '@src/shared/lib/email';

import { ForbiddenError, NotFoundError, UnauthorizedError } from '@src/shared/errors';

import { findFirstMember } from '@src/features/members/services/findFirstMember';

import { getVerificationCodeFirst } from '@src/features/auth/services/get-verification-code-first';
import { createVerificationCode } from '@src/features/auth/services/create-verification-code';

/**
 * POST /api/auth/mfa/resend — Resend the MFA setup verification code
 * Auth: auth middleware required
 *
 * Validates the user exists, enforces a cooldown period between resends
 * to prevent abuse, then generates a new OTP and persists it as a
 * SETUP_MFA verification code. The code is emailed to the user.
 */
export const postMfaResend: RequestHandler[] = [
  validate({}),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const userId = req.userId as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    // ---- Look up user ----
    const user = await findFirstMember({ where: { id: userId }, select: { email: true } });
    if (!user) throw new NotFoundError('User not found');

    // ---- Enforce resend cooldown ----
    const lastCode = await getVerificationCodeFirst({
      where: { userId, type: 'SETUP_MFA', expiresAt: { gt: new Date() }, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (lastCode) {
      const timeSinceLastCode = Date.now() - lastCode.createdAt.getTime();
      const cooldownMs = env.OTP_RESEND_COOLDOWN * 1000;
      if (timeSinceLastCode < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastCode) / 1000);
        throw new ForbiddenError(
          `Please wait ${remainingSeconds} seconds before requesting a new code`,
        );
      }
    }

    // ---- Generate and persist a new OTP ----
    const otp = generateOTP(env.OTP_LENGTH);
    const hashedOTP = hashToken(otp);
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

    await createVerificationCode({
      data: {
        user: { connect: { id: userId } },
        code: hashedOTP,
        type: 'SETUP_MFA',
        expiresAt: otpExpiry,
      },
    });

    // Email the code in production; log it in development for debugging
    if (env.NODE_ENV === 'production') await sendVerificationEmail(user.email, otp, 'SETUP_MFA');
    if (env.NODE_ENV === 'development') logger.debug({ otp }, 'OTP sent to ');

    return success(res, {
      message: 'Verification code sent to your email',
      data: { codeSent: true },
    });
  }),
];
