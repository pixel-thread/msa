import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { requireAuth } from "@src/shared/api/auth";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "@src/shared/lib/password";
import { BadRequestError, ValidationError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

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
      throw new ValidationError(
        "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      throw new BadRequestError(
        "Please use password reset to set a new password",
      );
    }

    const isValid = await verifyPassword(currentPassword, user.password);

    if (!isValid) {
      throw new BadRequestError("Current password is incorrect");
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return SuccessResponse({
      data: null,
      message:
        "Password changed successfully. Please sign in again on other devices.",
    });
  },
);
