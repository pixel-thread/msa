import { withValidation } from '@src/shared/api';
import { hashToken } from '@src/shared/lib/password';
import { SuccessResponse } from '@src/shared/utils';
import { SignOutSchema } from '@src/features/auth/validators';
import { updateRefreshTokens } from '@src/features/auth/services/update-refresh-tokens';
import { env } from '@src/env';
import { logger } from '@src/shared/logger/server';

export const POST = withValidation(
  { body: SignOutSchema },
  async (request, _context, { body, traceId }) => {
    logger.info({ traceId }, 'POST /api/auth/logout - Request started');
    const bodyToken = body?.token || request?.cookies?.get('refresh_token')?.value;

    if (bodyToken) {
      const hashedToken = hashToken(bodyToken);

      await updateRefreshTokens({
        where: { token: hashedToken },
        data: { revokedAt: new Date() },
      });
    }

    const response = SuccessResponse({
      message: 'Logged out successfully',
      data: null,
    });

    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    logger.info({ traceId }, 'POST /api/auth/logout - Success');

    return response;
  },
);
