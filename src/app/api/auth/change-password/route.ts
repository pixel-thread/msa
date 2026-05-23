import { withValidation } from "@src/shared/api";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "@src/shared/lib/password";
import {
  BadRequestError,
  UnauthorizedError,
  ValidationError,
} from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import {
  ChangePasswordInput,
  ChangePasswordSchema,
} from "@src/features/auth/validators";
import { updateUser } from "@src/features/user/services";
import { deleteRefreshTokens } from "@src/features/auth/services/delete-refresh-tokens";
import { getUniqueUserNoFilter } from "@src/shared/services/user/get-unique-user-no-filter";

export const POST = withValidation(
  { body: ChangePasswordSchema },
  async (req, _ctx, { body }) => {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      throw new UnauthorizedError("User not found");
    }

    const { currentPassword, newPassword } = body as ChangePasswordInput;

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new ValidationError(
        "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number",
      );
    }

    const user = await getUniqueUserNoFilter({
      where: { id: userId },
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

    await updateUser({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await deleteRefreshTokens({ where: { userId } });

    return SuccessResponse({
      data: null,
      message:
        "Password changed successfully. Please sign in again on other devices.",
    });
  },
);
