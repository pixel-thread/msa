import { Request, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ForgotPasswordInput, ForgotPasswordSchema } from '@src/features/auth/validators';
import { hashToken } from '@src/shared/lib/password';
import { signPasswordResetToken } from '@src/shared/lib/jwt';
import { sendPasswordResetEmail } from '@src/shared/lib/email';
import { env } from '@src/env';
import { updateUser } from '@src/features/user/services';
import { getUserFirst } from '@src/shared/services/user/get-user-first';
import { logger } from '@src/shared/logger';

export const postForgotPassword = [
  validate({ body: ForgotPasswordSchema }),
  async (req: Request, res: Response) => {
    const { email } = req.body as ForgotPasswordInput;
    const user = await getUserFirst({ where: { email } });

    if (!user) {
      return success(res, { message: 'A reset email will be sent', data: null });
    }

    const resetToken = await signPasswordResetToken(user.id);
    const hashedToken = hashToken(resetToken);
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1);

    await updateUser({
      where: { id: user.id },
      data: { passwordResetToken: hashedToken, passwordResetExpires: resetExpiry },
    });

    if (env.NODE_ENV === 'production') {
      await sendPasswordResetEmail(user.email, resetToken);
    }
    if (env.NODE_ENV === 'development') {
      logger.debug({ token: resetToken }, 'Reset password Token');
    }

    return success(res, { message: 'A reset email will be sent', data: null });
  },
];
