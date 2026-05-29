import { withValidation } from '@src/shared/api';
import { hashPassword, validatePasswordStrength, hashToken } from '@src/shared/lib/password';
import { UnauthorizedError, ValidationError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateUser } from '@src/features/user/services';
import { deleteRefreshTokens } from '@src/features/auth/services/delete-refresh-tokens';
import { ResetPasswordInput, ResetPasswordSchema } from '@src/features/auth/validators';
import { logger } from '@src/shared/logger/server';

export const POST = withValidation(
  { body: ResetPasswordSchema },
  async (_, _ctx, { body, traceId }) => {
    logger.info({ traceId }, 'POST /api/auth/reset-password - Request started');
    const { token, password } = body as ResetPasswordInput;

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      logger.error({ traceId }, 'POST /api/auth/reset-password - Invalid password strength input');
      throw new ValidationError(
        'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number',
      );
    }

    const hashedToken = hashToken(token);

    const user = await findFirstMember({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      logger.error({ traceId }, 'POST /api/auth/reset-password - Invalid or expired reset token');
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(password);

    await updateUser({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await deleteRefreshTokens({ where: { userId: user.id } });

    logger.info({ traceId, userId: user.id }, 'POST /api/auth/reset-password - Success');

    return SuccessResponse({
      data: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    });
  },
);
