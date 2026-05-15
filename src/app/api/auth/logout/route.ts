import { withValidation } from "@src/shared/api";
import { hashToken } from "@src/shared/lib/password";
import { SuccessResponse } from "@src/shared/utils";
import { SignOutSchema } from "@src/features/auth/validators";
import { updateRefreshTokens } from "@src/features/auth/services/update-refresh-tokens";

export const POST = withValidation(
  { body: SignOutSchema },
  async (_request, _context, { body }) => {
    const refreshCookie = body?.token;

    if (refreshCookie) {
      const hashedToken = hashToken(refreshCookie);

      await updateRefreshTokens({
        where: { token: hashedToken },
        data: { revokedAt: new Date() },
      });
    }

    const response = SuccessResponse({
      message: "Logged out successfully",
      data: null,
    });

    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return response;
  },
);

