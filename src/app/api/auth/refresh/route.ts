import { withValidation } from '@src/shared/api';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@src/shared/lib/jwt';
import { hashToken } from '@src/shared/lib/password';
import { UnauthorizedError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { RefreshTokenSchema } from '@src/features/auth/validators';
import { getUniqueRefreshToken } from '@src/features/auth/services/get-unique-refresh-token';
import { updateRefreshToken } from '@src/features/auth/services/update-refresh-token';
import { createRefreshToken } from '@src/features/auth/services/create-refresh-token';
import { revokedRefreshTokens } from '@src/features/auth/services/revoked-refresh-tokens';
import { cacheClient } from '@src/shared/lib/cache';
import { env } from '@src/env';
import { logger } from '@src/shared/logger/server';

export const POST = withValidation(
  { body: RefreshTokenSchema },
  async (request, _, { body, traceId }) => {
    logger.info({ traceId }, 'POST /api/auth/refresh - Request started');
    const bodyToken = body?.token;

    const refreshCookie = request.cookies.get('refresh_token')?.value || bodyToken;

    if (!refreshCookie) {
      logger.error({ traceId }, 'POST /api/auth/refresh - Refresh token not found');
      throw new UnauthorizedError('Refresh token not found');
    }

    try {
      await verifyRefreshToken(refreshCookie);
    } catch {
      logger.error({ traceId }, 'POST /api/auth/refresh - Invalid refresh token signature');
      throw new UnauthorizedError('Invalid refresh token');
    }

    const hashedToken = hashToken(refreshCookie);

    // 1. Check Grace Period Cache to handle race conditions
    const GRACE_PERIOD_KEY = `refresh_grace:${hashedToken}`;
    const cachedTokens = await cacheClient.get<{
      accessToken: string;
      refreshToken: string;
    }>(GRACE_PERIOD_KEY);

    if (cachedTokens) {
      logger.info(
        { traceId },
        'POST /api/auth/refresh - Success (grace period cached tokens returned)',
      );
      const response = SuccessResponse({
        message: 'Token refreshed successfully',
        data: {
          access_token: cachedTokens.accessToken,
          refresh_token: cachedTokens.refreshToken,
        },
      });

      response.cookies.set('access_token', cachedTokens.accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60,
        path: '/',
      });

      response.cookies.set('refresh_token', cachedTokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    const storedToken = await getUniqueRefreshToken({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!storedToken || !storedToken.userId) {
      logger.error({ traceId }, 'POST /api/auth/refresh - Invalid refresh token (not found in DB)');
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      const gracePeriodMs = 30 * 1000; // 30 seconds
      // If the token was revoked very recently but missed the cache,
      // don't trigger the family revocation fail-safe to prevent logging out the user
      // due to a parallel API request race condition.
      if (Date.now() - storedToken.revokedAt.getTime() > gracePeriodMs) {
        logger.warn(
          { traceId, userId: storedToken.userId },
          'POST /api/auth/refresh - Revoking all family tokens (potential reuse attack)',
        );
        await revokedRefreshTokens({
          where: { userId: storedToken.userId },
        });
      }
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      logger.error(
        { traceId, userId: storedToken.userId },
        'POST /api/auth/refresh - Refresh token expired',
      );
      throw new UnauthorizedError('Refresh token has expired');
    }

    const user = storedToken.user;

    if (user.status !== 'ACTIVE') {
      logger.error({ traceId, userId: user.id }, 'POST /api/auth/refresh - User is not active');
      throw new UnauthorizedError('User is not active');
    }

    const newAccessToken = await signAccessToken(user.id);
    const newRefreshToken = await signRefreshToken(user.id);
    const hashedNewRefreshToken = hashToken(newRefreshToken);

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    // Cache the new tokens BEFORE updating the DB to prevent the race condition
    // where a parallel request reads the DB before the cache is populated.
    await cacheClient.set(
      GRACE_PERIOD_KEY,
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      30,
    );

    await updateRefreshToken({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    await createRefreshToken({
      data: {
        user: { connect: { id: user.id } },
        token: hashedNewRefreshToken,
        expiresAt: refreshTokenExpiry,
      },
    });

    const response = SuccessResponse({
      message: 'Token refreshed successfully',
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      },
    });

    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
      path: '/',
    });

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    logger.info({ traceId, userId: user.id }, 'POST /api/auth/refresh - Success');

    return response;
  },
);
