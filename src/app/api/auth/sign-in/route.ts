import { withValidation } from '@src/shared/api';
import { verifyPassword } from '@src/shared/lib/password';
import { signAccessToken, signRefreshToken, signMfaTempToken } from '@src/shared/lib/jwt';
import { sendVerificationEmail } from '@src/shared/lib/email';
import { generateOTP, hashToken } from '@src/shared/lib/password';
import { env } from '@src/env';
import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';
import { SignInSchema } from '@src/features/auth/validators';
import { getUserFirst } from '@src/shared/services/user/get-user-first';
import { updateUser } from '@src/features/user/services';
import { createRefreshToken } from '@src/features/auth/services/create-refresh-token';
import { createVerificationCode } from '@src/features/auth/services/create-verification-code';

export const POST = withValidation({ body: SignInSchema }, async (_req, _ctx, { body }) => {
  const user = await getUserFirst({
    where: { email: body?.email },
  });

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000 / 60);
    throw new ForbiddenError(`Account is locked. Try again in ${remainingMinutes} minutes`);
  }

  const isPasswordValid = user?.password
    ? await verifyPassword(body?.password || '', user.password)
    : false;

  if (!isPasswordValid) {
    if (user) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = failedAttempts >= 5;

      await updateUser({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : failedAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });

      if (shouldLock) {
        throw new ForbiddenError('Too many failed attempts. Account locked');
      }
    }

    throw new UnauthorizedError('Invalid email or password');
  }

  // Password was verified against a user — user is guaranteed non-null here
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  await updateUser({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  if (user.mfaEnabled) {
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

    if (env.NODE_ENV === 'development') {
      logger.debug(`OTP: ${otp}`);
    }

    if (env.NODE_ENV === 'production') {
      await sendVerificationEmail(user.email, otp, 'LOGIN_MFA');
    }

    const mfaTempToken = await signMfaTempToken(user.id);

    const mfaResponse = SuccessResponse({
      message: 'MFA verification required',
      data: {
        tempToken: mfaTempToken,
        mfaRequired: true,
      },
    });

    mfaResponse.cookies.set('mfa_temp_token', mfaTempToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 5 * 60,
      path: '/',
    });

    return mfaResponse;
  }

  const accessToken = await signAccessToken(user.id);

  const refreshToken = await signRefreshToken(user.id);

  const hashedRefreshToken = hashToken(refreshToken);

  const refreshTokenExpiry = new Date();

  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

  await createRefreshToken({
    data: {
      user: { connect: { id: user.id } },
      token: hashedRefreshToken,
      expiresAt: refreshTokenExpiry,
    },
  });

  const response = SuccessResponse({
    message: 'Signed in successfully',
    data: {
      access_token: accessToken,
      refresh_token: refreshToken,
    },
  });

  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60,
    path: '/',
  });

  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return response;
});
