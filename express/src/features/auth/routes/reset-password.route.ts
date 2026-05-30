import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';

import {
  hashPassword,
  validatePasswordStrength,
  hashToken,
} from '@src/shared/lib/password';

import { UnauthorizedError, ValidationError } from '@src/shared/errors';

import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateUser } from '@src/features/user/services';

import { deleteRefreshTokens } from '@src/features/auth/services/delete-refresh-tokens';

import { ResetPasswordInput, ResetPasswordSchema } from '@src/features/auth/validators';

/**
 * POST /api/auth/reset-password — Complete password reset with token
 * Auth: none (public, relies on reset token from email)
 *
 * Validates the new password strength, verifies the reset token,
 * updates the user's password, clears the reset fields, and revokes
 * all existing refresh tokens to force re-login on all devices.
 */
export const postResetPassword: RequestHandler[] = [
  validate({ body: ResetPasswordSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'POST /api/auth/reset-password - Request started');
    const { token, password } = req.body as ResetPasswordInput;

    // ---- Validate password strength ----
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new ValidationError(
        'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number',
      );
    }

    // ---- Verify reset token ----
    const hashedToken = hashToken(token);
    const user = await findFirstMember({
      where: { passwordResetToken: hashedToken, passwordResetExpires: { gt: new Date() } },
    });

    if (!user) throw new UnauthorizedError('Invalid or expired reset token');

    // ---- Update password and clear reset fields ----
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

    // Revoke all refresh tokens so the user must sign in again on every device
    await deleteRefreshTokens({ where: { userId: user.id } });

    logger.info({ traceId, userId: user.id }, 'POST /api/auth/reset-password - Success');
    return success(res, {
      data: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    });
  }),
];
