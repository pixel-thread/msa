import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { SignOutSchema } from '@src/features/auth/validators';
import { hashToken } from '@src/shared/lib/password';
import { updateRefreshTokens } from '@src/features/auth/services/update-refresh-tokens';
import { env } from '@src/env';
import { logger } from '@src/shared/logger';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** POST handler for logging out. Revokes the refresh token and clears auth cookies. */
export const postLogout: RequestHandler[] = [
  validate({ body: SignOutSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'POST /api/auth/logout - Request started');
    const bodyToken = req.body?.token || req.cookies?.refresh_token;

    if (bodyToken) {
      const hashedToken = hashToken(bodyToken);
      await updateRefreshTokens({
        where: { token: hashedToken },
        data: { revokedAt: new Date() },
      });
    }

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    logger.info({ traceId }, 'POST /api/auth/logout - Success');
    return success(res, { message: 'Logged out successfully', data: null });
  }),
];
