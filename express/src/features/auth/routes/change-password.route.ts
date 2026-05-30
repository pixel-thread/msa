import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ChangePasswordInput, ChangePasswordSchema } from '@src/features/auth/validators';
import { hashPassword, validatePasswordStrength, verifyPassword } from '@src/shared/lib/password';
import { BadRequestError, UnauthorizedError, ValidationError } from '@src/shared/errors';
import { updateUser } from '@src/features/user/services';
import { deleteRefreshTokens } from '@src/features/auth/services/delete-refresh-tokens';
import { getUniqueUserNoFilter } from '@src/shared/services/user/get-unique-user-no-filter';
import { logger } from '@src/shared/logger';

export const postChangePassword = [
  validate({ body: ChangePasswordSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const userId = req.headers['x-user-id'] as string;
    logger.info({ traceId, userId }, 'POST /api/auth/change-password - Request started');
    if (!userId) throw new UnauthorizedError('User not found');

    const { currentPassword, newPassword } = req.body as ChangePasswordInput;
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.errors.join('; '));
    }

    const user = await getUniqueUserNoFilter({ where: { id: userId } });
    if (!user || !user.password) throw new BadRequestError('Please use password reset to set a new password');

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) throw new BadRequestError('Current password is incorrect');

    const hashedPassword = await hashPassword(newPassword);
    await updateUser({ where: { id: userId }, data: { password: hashedPassword } });
    await deleteRefreshTokens({ where: { userId } });

    logger.info({ traceId, userId }, 'POST /api/auth/change-password - Success');
    return success(res, { data: null, message: 'Password changed successfully. Please sign in again on other devices.' });
  },
];
