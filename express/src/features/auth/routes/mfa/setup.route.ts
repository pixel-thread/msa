import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { z } from 'zod';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { env } from '@src/env';

import { verifyPassword, generateOTP, hashToken } from '@src/shared/lib/password';
import { sendVerificationEmail } from '@src/shared/lib/email';

import { BadRequestError, ConflictError, UnauthorizedError, ValidationError } from '@src/shared/errors';

import { findFirstMember } from '@src/features/members/services/findFirstMember';

import { createVerificationCode } from '@src/features/auth/services/create-verification-code';

/** Schema for setting up MFA — requires the user's current password. */
const SetupMfaSchema = z.object({ password: z.string().min(1, 'Password is required') });

/**
 * POST /api/auth/mfa/setup — Initiate MFA setup by sending a verification code
 * Auth: auth middleware required
 *
 * Verifies the user's current password, ensures MFA is not already enabled,
 * then generates an OTP and persists it as a verification code for SETUP_MFA.
 * The code is emailed to the user; in development it is logged to the console.
 */
export const postMfaSetup: RequestHandler[] = [
  validate({ body: SetupMfaSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const userId = req.userId as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { password } = req.body;

    // ---- Fetch user and verify password ----
    const user = await findFirstMember({
      where: { id: userId },
      select: { password: true, mfaEnabled: true },
    });

    if (!user || !user.password) throw new BadRequestError('Please set a password first');
    if (user.mfaEnabled) throw new ConflictError('MFA is already enabled');

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) throw new ValidationError('Invalid password');

    // ---- Generate and persist OTP ----
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

    // Send the code to the user's email
    const authUser = await findFirstMember({ where: { id: userId }, select: { email: true } });
    if (authUser && env.NODE_ENV === 'production')
      await sendVerificationEmail(authUser.email, otp, 'SETUP_MFA');
    if (authUser && env.NODE_ENV === 'development') logger.debug({ otp }, 'OTP:');

    return success(res, {
      message: 'Verification code sent to your email',
      data: { pending: true, codeSent: true },
    });
  }),
];
