import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { verifyPasswordResetToken } from "@src/shared/lib/jwt";
import { signAccessToken, signRefreshToken } from "@src/shared/lib/jwt";
import { hashToken } from "@src/shared/lib/password";
import { env } from "@src/env";
import {
  BadRequestError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

const verifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  mfa_temp_token: z.string().optional(),
});

type VerifyBody = z.infer<typeof verifySchema>;

export const POST = withValidation(
  { body: verifySchema },
  async (request, _ctx, { body }) => {
    const { code } = body as VerifyBody;

    const mfaCookie =
      request.cookies.get("mfa_temp_token")?.value || body?.mfa_temp_token;

    if (!mfaCookie) {
      throw new BadRequestError("Session expired. Please signin again");
    }

    let payload;
    try {
      payload = await verifyPasswordResetToken(mfaCookie);
    } catch {
      throw new BadRequestError("Session expired. Please signin again");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedError("User not found or inactive");
    }

    const hashedCode = hashToken(code);

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        type: "LOGIN_MFA",
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verificationCode) {
      throw new UnauthorizedError("Invalid or expired verification code");
    }

    if (verificationCode.attempts >= env.OTP_MAX_ATTEMPTS) {
      throw new TooManyRequestsError(
        "Too many attempts. Please request a new code",
      );
    }

    if (verificationCode.code !== hashedCode) {
      await prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } },
      });

      throw new UnauthorizedError("Invalid verification code");
    }

    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { usedAt: new Date() },
    });

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);
    const hashedRefreshToken = hashToken(refreshToken);

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedRefreshToken,
        expiresAt: refreshTokenExpiry,
      },
    });

    const response = SuccessResponse({
      message: "Signed in successfully",
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });

    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
      path: "/",
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.delete("mfa_temp_token");

    return response;
  },
);

