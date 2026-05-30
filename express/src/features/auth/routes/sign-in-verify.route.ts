import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { env } from '@src/env';

import {
  verifyMfaTempToken,
  signAccessToken,
  signRefreshToken,
} from '@src/shared/lib/jwt';
import { hashToken } from '@src/shared/lib/password';

import {
  BadRequestError,
  TooManyRequestsError,
  UnauthorizedError,
} from '@src/shared/errors';

import { getUniqueUser } from '@src/shared/services/user/get-unique-user';

import { getVerificationCodeFirst } from '@src/features/auth/services/get-verification-code-first';
import { updateVerificationCode } from '@src/features/auth/services/update-verification-code';
import { createRefreshToken } from '@src/features/auth/services/create-refresh-token';

import { VerifySignInInput, VerifySignInSchema } from '@src/features/auth/validators';

/**
 * POST /api/auth/sign-in/verify — Complete MFA sign-in by verifying the OTP code
 * Auth: none (relies on mfa_temp_token cookie/body)
 *
 * Verifies the MFA temp token, checks the OTP code validity and attempts,
 * then issues access and refresh tokens on success.
 */
export const postSignInVerify: RequestHandler[] = [
  validate({ body: VerifySignInSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'POST /api/auth/sign-in/verify - Request started');
    const { code } = req.body as VerifySignInInput;
    const mfaCookie = req.cookies?.mfa_temp_token || req.body?.mfa_temp_token;

    // ---- Validate MFA temp token ----
    if (!mfaCookie) throw new BadRequestError('Session expired. Please signin again');

    let payload;
    try {
      payload = await verifyMfaTempToken(mfaCookie);
    } catch {
      throw new BadRequestError('Session expired. Please signin again');
    }

    // ---- Look up user from the temp token payload ----
    const user = await getUniqueUser({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User not found or inactive');
    }

    // ---- Verify OTP code ----
    const hashedCode = hashToken(code);
    const verificationCode = await getVerificationCodeFirst({
      where: {
        userId: user.id,
        type: 'LOGIN_MFA',
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    // No valid code found or code has expired
    if (!verificationCode) throw new UnauthorizedError('Invalid or expired verification code');

    // Enforce max attempts to prevent brute-force guessing
    if (verificationCode.attempts >= env.OTP_MAX_ATTEMPTS) {
      throw new TooManyRequestsError('Too many attempts. Please request a new code');
    }

    // Code mismatch — increment attempt counter
    if (verificationCode.code !== hashedCode) {
      await updateVerificationCode({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedError('Invalid verification code');
    }

    // ---- Mark verification code as used ----
    await updateVerificationCode({
      where: { id: verificationCode.id },
      data: { usedAt: new Date() },
    });

    // ---- Issue access and refresh tokens ----
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

    // Set secure httpOnly cookies and clear the MFA temp cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.clearCookie('mfa_temp_token');

    logger.info({ traceId, userId: user.id }, 'POST /api/auth/sign-in/verify - Success');

    return success(res, {
      message: 'Signed in successfully',
      data: { access_token: accessToken, refresh_token: refreshToken },
    });
  }),
];
