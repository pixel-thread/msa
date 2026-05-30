import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import z from 'zod';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { env } from '@src/env';

import { generateOTP, hashToken } from '@src/shared/lib/password';
import { verifyMfaTempToken } from '@src/shared/lib/jwt';
import { sendVerificationEmail } from '@src/shared/lib/email';

import { BadRequestError, NotFoundError, TooManyRequestsError } from '@src/shared/errors';

import { getUniqueUser } from '@src/shared/services/user/get-unique-user';

import { getVerificationCodeFirst } from '@src/features/auth/services/get-verification-code-first';
import { createVerificationCode } from '@src/features/auth/services/create-verification-code';

/** Schema for resending the sign-in MFA code — requires the temp session token. */
const ResendSignInCodeSchema = z.object({ mfa_temp_token: z.string() });

/**
 * POST /api/auth/sign-in/resend — Resend the MFA code during sign-in
 * Auth: none (relies on mfa_temp_token cookie/body)
 *
 * Validates the MFA temp token, enforces a cooldown between resends to
 * prevent abuse, then generates and sends a new OTP verification code.
 */
export const postSignInResend: RequestHandler[] = [
  validate({ body: ResendSignInCodeSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const mfaCookie = req.cookies?.mfa_temp_token || req.body?.mfa_temp_token;
    if (!mfaCookie) throw new BadRequestError('Session expired. Please signin again');

    // ---- Verify the MFA temp token ----
    let payload;
    try {
      payload = await verifyMfaTempToken(mfaCookie);
    } catch {
      throw new BadRequestError('Session expired. Please signin again');
    }

    // ---- Look up the user from the token payload ----
    const user = await getUniqueUser({ where: { id: payload?.sub } });
    if (!user) throw new NotFoundError('User not found');

    // ---- Enforce resend cooldown ----
    const lastCode = await getVerificationCodeFirst({
      where: {
        userId: payload.sub,
        type: 'LOGIN_MFA',
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastCode) {
      const timeSinceLastCode = Date.now() - lastCode.createdAt.getTime();
      const cooldownMs = env.OTP_RESEND_COOLDOWN * 1000;
      if (timeSinceLastCode < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastCode) / 1000);
        throw new TooManyRequestsError(
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
        user: { connect: { id: user.id } },
        code: hashedOTP,
        type: 'LOGIN_MFA',
        expiresAt: otpExpiry,
      },
    });

    // Email the code in production; log it in development for debugging
    if (env.NODE_ENV === 'production') await sendVerificationEmail(user.email, otp, 'LOGIN_MFA');
    if (env.NODE_ENV === 'development') logger.debug('Verification code: ' + otp);

    return success(res, {
      message: 'Verification code sent to your email',
      data: { codeSent: true },
    });
  }),
];
