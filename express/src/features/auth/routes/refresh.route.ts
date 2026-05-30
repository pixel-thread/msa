import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { env } from '@src/env';

import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@src/shared/lib/jwt';
import { hashToken } from '@src/shared/lib/password';

import { UnauthorizedError } from '@src/shared/errors';

import { cacheClient } from '@src/shared/lib/cache';

import { getUniqueRefreshToken } from '@src/features/auth/services/get-unique-refresh-token';
import { updateRefreshToken } from '@src/features/auth/services/update-refresh-token';
import { createRefreshToken } from '@src/features/auth/services/create-refresh-token';
import { revokedRefreshTokens } from '@src/features/auth/services/revoked-refresh-tokens';

import { RefreshTokenSchema } from '@src/features/auth/validators';

/**
 * POST /api/auth/refresh — Rotate access and refresh tokens
 * Auth: none (relies on refresh_token cookie/body)
 *
 * Verifies the current refresh token, checks for reuse (revocation),
 * enforces a grace period for concurrent requests, then issues a new
 * token pair and revokes the old one.
 */
export const postRefresh: RequestHandler[] = [
  validate({ body: RefreshTokenSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'POST /api/auth/refresh - Request started');

    const bodyToken = req.body?.token;

    const refreshCookie = req.cookies?.refresh_token || bodyToken;

    if (!refreshCookie) throw new UnauthorizedError('Refresh token not found');

    // ---- Verify the JWT signature ----
    try {
      await verifyRefreshToken(refreshCookie);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // ---- Check cache for grace period (handles concurrent refresh requests) ----
    const hashedToken = hashToken(refreshCookie);
    const GRACE_PERIOD_KEY = `refresh_grace:${hashedToken}`;
    const cachedTokens = await cacheClient.get<{ accessToken: string; refreshToken: string }>(
      GRACE_PERIOD_KEY,
    );

    if (cachedTokens) {
      logger.info({ traceId }, 'POST /api/auth/refresh - Success (cached)');
      res.cookie('access_token', cachedTokens.accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });
      res.cookie('refresh_token', cachedTokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      return success(res, {
        message: 'Token refreshed successfully',
        data: { access_token: cachedTokens.accessToken, refresh_token: cachedTokens.refreshToken },
      });
    }

    // ---- Look up the stored refresh token in DB ----
    const storedToken = await getUniqueRefreshToken({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!storedToken || !storedToken.userId) throw new UnauthorizedError('Invalid refresh token');

    // ---- Detect token reuse (revoked token presented) ----
    if (storedToken.revokedAt) {
      // Grace period allows concurrent requests without invalidating all family tokens
      const gracePeriodMs = 30 * 1000;
      if (Date.now() - storedToken.revokedAt.getTime() > gracePeriodMs) {
        logger.warn({ traceId, userId: storedToken.userId }, 'Revoking all family tokens');
        await revokedRefreshTokens({ where: { userId: storedToken.userId } });
      }
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Reject expired tokens
    if (storedToken.expiresAt < new Date())
      throw new UnauthorizedError('Refresh token has expired');

    // Inactive users should not receive new tokens
    const user = storedToken.user;
    if (user.status !== 'ACTIVE') throw new UnauthorizedError('User is not active');

    // ---- Issue new token pair and revoke the old one ----
    const newAccessToken = await signAccessToken(user.id);
    const newRefreshToken = await signRefreshToken(user.id);
    const hashedNewRefreshToken = hashToken(newRefreshToken);
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    // Cache new tokens within the grace window so concurrent refreshes reuse them
    await cacheClient.set(
      GRACE_PERIOD_KEY,
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      30,
    );
    await updateRefreshToken({ where: { id: storedToken.id }, data: { revokedAt: new Date() } });
    await createRefreshToken({
      data: {
        user: { connect: { id: user.id } },
        token: hashedNewRefreshToken,
        expiresAt: refreshTokenExpiry,
      },
    });

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    logger.info({ traceId, userId: user.id }, 'POST /api/auth/refresh - Success');
    return success(res, {
      message: 'Token refreshed successfully',
      data: { access_token: newAccessToken, refresh_token: newRefreshToken },
    });
  }),
];
