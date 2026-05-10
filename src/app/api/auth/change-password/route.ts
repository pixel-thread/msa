import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { requireAuth } from "@src/shared/api/auth";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "@src/shared/lib/password";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

type ChangePasswordBody = z.infer<typeof changePasswordSchema>;

export const POST = withValidation(
  { body: changePasswordSchema },
  async (_, _ctx, { body }) => {
    const { userId } = await requireAuth();

    const { currentPassword, newPassword } = body as ChangePasswordBody;

    const passwordValidation = validatePasswordStrength(newPassword);
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Please use password reset to set a new password",
        },
        { status: 400 },
      );
    }

    const isValid = await verifyPassword(currentPassword, user.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 401 },
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message:
        "Password changed successfully. Please sign in again on other devices.",
    });
  },
);

