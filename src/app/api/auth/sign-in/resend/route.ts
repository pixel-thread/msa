import { withValidation } from '@src/shared/api';
import { verifyMfaTempToken } from '@src/shared/lib/jwt';
import { generateOTP, hashToken } from '@src/shared/lib/password';
import { sendVerificationEmail } from '@src/shared/lib/email';
import { env } from '@src/env';
import z from 'zod';
import { BadRequestError, NotFoundError, TooManyRequestsError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { getUniqueUser } from '@src/shared/services/user/get-unique-user';
import { getVerificationCodeFirst } from '@src/features/auth/services/get-verification-code-first';
import { createVerificationCode } from '@src/features/auth/services/create-verification-code';
import { logger } from '@src/shared/logger/server';

const ResendSignInCodeSchema = z.object({
  mfa_temp_token: z.string(),
});

export const POST = withValidation(
  { body: ResendSignInCodeSchema },
  async (request, _ctx, { body }) => {
    const mfaCookie = request.cookies.get('mfa_temp_token')?.value || body?.mfa_temp_token;

    if (!mfaCookie) {
      throw new BadRequestError('Session expired. Please signin again');
    }

    let payload;

    try {
      payload = await verifyMfaTempToken(mfaCookie);
    } catch {
      throw new BadRequestError('Session expired. Please signin again');
    }

    const user = await getUniqueUser({
      where: { id: payload?.sub },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

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

    if (env.NODE_ENV === 'production') {
      await sendVerificationEmail(user.email, otp, 'LOGIN_MFA');
    }

    if (env.NODE_ENV === 'development') {
      logger.debug('Verification code: ' + otp);
    }

    return SuccessResponse({
      message: 'Verification code sent to your email',
      data: {
        codeSent: true,
      },
    });
  },
);
