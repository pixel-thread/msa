import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { hashToken } from "@src/shared/lib/password";
import { signPasswordResetToken } from "@src/shared/lib/jwt";
import { sendPasswordResetEmail } from "@src/shared/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;

export const POST = withValidation(
  { body: forgotPasswordSchema },
  async (_, { body }) => {
    const { email } = body as ForgotPasswordBody;

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset email will be sent",
      });
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

    await sendPasswordResetEmail(user.email, resetToken);

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset email will be sent",
    });
  }
);