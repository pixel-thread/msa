import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { hashToken } from "@src/shared/lib/password";
import { signPasswordResetToken } from "@src/shared/lib/jwt";
import { sendPasswordResetEmail } from "@src/shared/lib/email";
import { SuccessResponse } from "@src/shared/utils";
import { env } from "@src/env";
import { logger } from "@src/shared/logger";
import { NotFoundError } from "@src/shared/errors";

const ForgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

type ForgotPasswordBody = z.infer<typeof ForgotPasswordSchema>;

export const POST = withValidation(
  { body: ForgotPasswordSchema },
  async (_, _ctx, { body }) => {
    const { email } = body as ForgotPasswordBody;

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const resetToken = await signPasswordResetToken(user.id);
    const hashedToken = hashToken(resetToken);

    const resetExpiry = new Date();

    resetExpiry.setHours(resetExpiry.getHours() + 1);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpiry,
      },
    });

    if (env.NODE_ENV === "production") {
      await sendPasswordResetEmail(user.email, resetToken);
    }

    if (env.NODE_ENV === "development") {
      logger.debug("Reset password Token", { token: resetToken });
    }

    return SuccessResponse({
      message: "If an account exists, a reset email will be sent",
      data: null,
    });
  },
);
