import { withValidation } from '@src/shared/api';
import { hashPassword, validatePasswordStrength, verifyPassword } from '@src/shared/lib/password';
import { BadRequestError, UnauthorizedError, ValidationError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { ChangePasswordInput, ChangePasswordSchema } from '@src/features/auth/validators';
import { updateUser } from '@src/features/user/services';
import { deleteRefreshTokens } from '@src/features/auth/services/delete-refresh-tokens';
import { getUniqueUserNoFilter } from '@src/shared/services/user/get-unique-user-no-filter';
import { logger } from '@src/shared/logger/server';

export const POST = withValidation(
  { body: ChangePasswordSchema },
  async (req, _ctx, { body, traceId }) => {
    const userId = req.headers.get('x-user-id');
    logger.info({ traceId, userId }, 'POST /api/auth/change-password - Request started');

    if (!userId) {
      logger.error(
        { traceId },
        'POST /api/auth/change-password - User not found (missing x-user-id)',
      );
      throw new UnauthorizedError('User not found');
    }

    const { currentPassword, newPassword } = body as ChangePasswordInput;

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      logger.error(
        { traceId, userId },
        'POST /api/auth/change-password - Invalid password strength',
      );
      throw new ValidationError(passwordValidation.errors.join('; '));
    }

    const user = await getUniqueUserNoFilter({
      where: { id: userId },
    });

    if (!user || !user.password) {
      logger.error(
        { traceId, userId },
        'POST /api/auth/change-password - User has no password set',
      );
      throw new BadRequestError('Please use password reset to set a new password');
    }

    const isValid = await verifyPassword(currentPassword, user.password);

    if (!isValid) {
      logger.error(
        { traceId, userId },
        'POST /api/auth/change-password - Current password incorrect',
      );
      throw new BadRequestError('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);

    await updateUser({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await deleteRefreshTokens({ where: { userId } });

    logger.info({ traceId, userId }, 'POST /api/auth/change-password - Success');

    return SuccessResponse({
      data: null,
      message: 'Password changed successfully. Please sign in again on other devices.',
    });
  },
);
