import { z } from 'zod';

import { withValidation } from '@src/shared/api';
import { verifyPassword } from '@src/shared/lib/password';
import { generateOTP, hashToken } from '@src/shared/lib/password';
import { sendVerificationEmail } from '@src/shared/lib/email';
import { env } from '@src/env';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { createVerificationCode } from '@src/features/auth/services/create-verification-code';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';

const SetupMfaSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type SetupMfaBody = z.infer<typeof SetupMfaSchema>;

export const POST = withValidation({ body: SetupMfaSchema }, async (request, _ctx, { body }) => {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new UnauthorizedError('Unauthorized');

  const { password } = body as SetupMfaBody;

  const user = await findFirstMember({
    where: { id: userId },
    select: { password: true, mfaEnabled: true },
  });

  if (!user || !user.password) {
    throw new BadRequestError('Please set a password first');
  }

  if (user.mfaEnabled) {
    throw new ConflictError('MFA is already enabled');
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    throw new ValidationError('Invalid password');
  }

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

  const authUser = await findFirstMember({
    where: { id: userId },
    select: { email: true },
  });

  if (authUser && env.NODE_ENV === 'production') {
    await sendVerificationEmail(authUser.email, otp, 'SETUP_MFA');
  }

  if (authUser && env.NODE_ENV === 'development') {
    logger.debug({ otp }, 'OTP:');
  }

  return SuccessResponse({
    message: 'Verification code sent to your email',
    data: {
      pending: true,
      codeSent: true,
    },
  });
});
