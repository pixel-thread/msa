import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';

import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from '@src/shared/lib/password';

import {
  BadRequestError,
  UnauthorizedError,
  ValidationError,
} from '@src/shared/errors';

import { getUniqueUserNoFilter } from '@src/shared/services/user/get-unique-user-no-filter';
import { updateUser } from '@src/features/user/services';

import { deleteRefreshTokens } from '@src/features/auth/services/delete-refresh-tokens';

import { ChangePasswordInput, ChangePasswordSchema } from '@src/features/auth/validators';

/**
 * POST /api/auth/change-password — Change password for the authenticated user
 * Auth: auth middleware required
 *
 * Validates the current password, ensures the new password meets strength
 * requirements, updates it, and revokes all existing refresh tokens to
 * force re-authentication on all devices.
 */
export const postChangePassword: RequestHandler[] = [
  validate({ body: ChangePasswordSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const userId = req.userId as string;
    logger.info({ traceId, userId }, 'POST /api/auth/change-password - Request started');
    if (!userId) throw new UnauthorizedError('User not found');

    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    // ---- Validate new password strength ----
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.errors.join('; '));
    }

    // ---- Fetch user and verify current password ----
    const user = await getUniqueUserNoFilter({ where: { id: userId } });
    if (!user || !user.password)
      throw new BadRequestError('Please use password reset to set a new password');

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) throw new BadRequestError('Current password is incorrect');

    // ---- Update password and revoke all existing sessions ----
    const hashedPassword = await hashPassword(newPassword);
    await updateUser({ where: { id: userId }, data: { password: hashedPassword } });
    await deleteRefreshTokens({ where: { userId } });

    logger.info({ traceId, userId }, 'POST /api/auth/change-password - Success');
    return success(res, {
      data: null,
      message: 'Password changed successfully. Please sign in again on other devices.',
    });
  }),
];
