import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import {
  hashPassword,
  validatePasswordStrength,
  hashToken,
} from "@src/shared/lib/password";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;

export const POST = withValidation(
  { body: resetPasswordSchema },
  async (_, _ctx, { body }) => {
    const { token, password } = body as ResetPasswordBody;

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: passwordValidation.errors[0],
          errors: passwordValidation.errors,
        },
        { status: 400 },
      );
    }

    const hashedToken = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message:
        "Password reset successfully. Please sign in with your new password.",
    });
  },
);

