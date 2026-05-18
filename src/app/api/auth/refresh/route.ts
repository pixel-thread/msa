import { withValidation } from "@src/shared/api";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "@src/shared/lib/jwt";
import { hashToken } from "@src/shared/lib/password";
import { UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import { RefreshTokenSchema } from "@src/features/auth/validators";
import { getUniqueRefreshToken } from "@src/features/auth/services/get-unique-refresh-token";
import { updateRefreshToken } from "@src/features/auth/services/update-refresh-token";
import { createRefreshToken } from "@src/features/auth/services/create-refresh-token";

export const POST = withValidation(
  { body: RefreshTokenSchema },
  async (request, _, { body }) => {
    const bodyToken = body?.token;

    const refreshCookie =
      request.cookies.get("refresh_token")?.value || bodyToken;

    if (!refreshCookie) {
      throw new UnauthorizedError("Refresh token not found");
    }

    try {
      await verifyRefreshToken(refreshCookie);
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const hashedToken = hashToken(refreshCookie);

    const storedToken = await getUniqueRefreshToken({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token has expired");
    }

    const user = storedToken.user;

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError("User is not active");
    }

    await updateRefreshToken({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const newAccessToken = await signAccessToken(user.id);
    const newRefreshToken = await signRefreshToken(user.id);
    const hashedNewRefreshToken = hashToken(newRefreshToken);

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await createRefreshToken({
      data: {
        user: { connect: { id: user.id } },
        token: hashedNewRefreshToken,
        expiresAt: refreshTokenExpiry,
      },
    });

    const response = SuccessResponse({
      message: "Token refreshed successfully",
      data: {
        refreshToken: newRefreshToken,
        accessToken: newAccessToken,
      },
    });

    response.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
      path: "/",
    });

    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  },
);
