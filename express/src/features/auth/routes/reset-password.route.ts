import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ResetPasswordInput, ResetPasswordSchema } from '@src/features/auth/validators';
import { hashPassword, validatePasswordStrength, hashToken } from '@src/shared/lib/password';
import { UnauthorizedError, ValidationError } from '@src/shared/errors';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateUser } from '@src/features/user/services';
import { deleteRefreshTokens } from '@src/features/auth/services/delete-refresh-tokens';
import { logger } from '@src/shared/logger';

export const postResetPassword = [
  validate({ body: ResetPasswordSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId }, 'POST /api/auth/reset-password - Request started');
    const { token, password } = req.body as ResetPasswordInput;

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new ValidationError('Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number');
    }

    const hashedToken = hashToken(token);
    const user = await findFirstMember({
      where: { passwordResetToken: hashedToken, passwordResetExpires: { gt: new Date() } },
    });

    if (!user) throw new UnauthorizedError('Invalid or expired reset token');

    const hashedPassword = await hashPassword(password);
    await updateUser({
      where: { id: user.id },
      data: { password: hashedPassword, passwordResetToken: null, passwordResetExpires: null, failedLoginAttempts: 0, lockedUntil: null },
    });

    await deleteRefreshTokens({ where: { userId: user.id } });

    logger.info({ traceId, userId: user.id }, 'POST /api/auth/reset-password - Success');
    return success(res, { data: true, message: 'Password reset successfully. Please sign in with your new password.' });
  },
];
