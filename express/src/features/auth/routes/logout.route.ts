import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { env } from '@src/env';

import { hashToken } from '@src/shared/lib/password';

import { updateRefreshTokens } from '@src/features/auth/services/update-refresh-tokens';

import { SignOutSchema } from '@src/features/auth/validators';

/**
 * POST /api/auth/logout — Revoke the current refresh token and clear auth cookies
 * Auth: auth middleware required
 *
 * Revokes the refresh token in the database and clears the access_token
 * and refresh_token cookies from the client's browser.
 */
export const postLogout: RequestHandler[] = [
  validate({ body: SignOutSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'POST /api/auth/logout - Request started');
    const bodyToken = req.body?.token || req.cookies?.refresh_token;

    // Revoke the token if one was provided (prevents future use)
    if (bodyToken) {
      const hashedToken = hashToken(bodyToken);
      await updateRefreshTokens({
        where: { token: hashedToken },
        data: { revokedAt: new Date() },
      });
    }

    // Clear both auth cookies from the browser regardless
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    logger.info({ traceId }, 'POST /api/auth/logout - Success');
    return success(res, { message: 'Logged out successfully', data: null });
  }),
];
