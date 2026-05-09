import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { verifyPassword } from "@src/shared/lib/password";
import {
  signAccessToken,
  signRefreshToken,
  signPasswordResetToken,
} from "@src/shared/lib/jwt";
import { sendVerificationEmail } from "@src/shared/lib/email";
import { generateOTP, hashToken } from "@src/shared/lib/password";
import { env } from "@src/env";
import { ForbiddenError, UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import { passwordValidation } from "@src/shared/lib/validations/auth";

const SignInSchema = z.object({
  email: z.email("Invalid email address"),
  password: passwordValidation,
});

export const POST = withValidation(
  { body: SignInSchema },
  async (_req, _ctx, { body }) => {
    const user = await prisma.user.findFirst({
      where: { email: body?.email },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (!user.password) {
      throw new UnauthorizedError("Please reset your password");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 1000 / 60,
      );
      throw new ForbiddenError(
        `Account is locked. Try again in ${remainingMinutes} minutes`,
      );
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError("User not found or inactive");
    }

    const isPasswordValid = await verifyPassword(
      body?.password || "",
      user.password,
    );

    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = failedAttempts >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : failedAttempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + 15 * 60 * 1000)
            : null,
        },
      });

      if (shouldLock) {
        throw new ForbiddenError("Too many failed attempts. Account locked");
      }

      throw new UnauthorizedError("Invalid email or password");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    if (user.mfaEnabled) {
      const otp = generateOTP(env.OTP_LENGTH);
      const hashedOTP = hashToken(otp);

      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

      await prisma.verificationCode.create({
        data: {
          userId: user.id,
          code: hashedOTP,
          type: "LOGIN_MFA",
          expiresAt: otpExpiry,
        },
      });

      await sendVerificationEmail(user.email, otp, "LOGIN_MFA");

      const mfaTempToken = await signPasswordResetToken(user.id);
      const mfaResponse = NextResponse.json({
        success: true,
        message: "MFA verification required",
        mfaRequired: true,
        data: {
          tempToken: mfaTempToken,
        },
      });

      mfaResponse.cookies.set("mfa_temp_token", mfaTempToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 5 * 60,
        path: "/",
      });

      return mfaResponse;
    }

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
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
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

    return response;
  },
);
