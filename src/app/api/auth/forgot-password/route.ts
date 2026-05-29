import { withValidation } from '@src/shared/api';
import { hashToken } from '@src/shared/lib/password';
import { signPasswordResetToken } from '@src/shared/lib/jwt';
import { sendPasswordResetEmail } from '@src/shared/lib/email';
import { SuccessResponse } from '@src/shared/utils';
import { env } from '@src/env';
import { logger } from '@src/shared/logger/server';
import { ForgotPasswordInput, ForgotPasswordSchema } from '@src/features/auth/validators';
import { updateUser } from '@src/features/user/services';
import { getUserFirst } from '@src/shared/services/user/get-user-first';

export const POST = withValidation({ body: ForgotPasswordSchema }, async (_, _ctx, { body }) => {
  const { email } = body as ForgotPasswordInput;

  const user = await getUserFirst({
    where: { email },
  });

  if (!user) {
    return SuccessResponse({
      message: 'A reset email will be sent',
      data: null,
    });
  }

  const resetToken = await signPasswordResetToken(user.id);
  const hashedToken = hashToken(resetToken);

  const resetExpiry = new Date();

  resetExpiry.setHours(resetExpiry.getHours() + 1);

  await updateUser({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: resetExpiry,
    },
  });

  if (env.NODE_ENV === 'production') {
    await sendPasswordResetEmail(user.email, resetToken);
  }

  if (env.NODE_ENV === 'development') {
    logger.debug({ token: resetToken }, 'Reset password Token');
  }

  return SuccessResponse({
    message: 'A reset email will be sent',
    data: null,
  });
});
