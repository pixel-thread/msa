import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { verifyPasswordResetToken } from "@src/shared/lib/jwt";
import { signAccessToken, signRefreshToken } from "@src/shared/lib/jwt";
import { hashToken } from "@src/shared/lib/password";
import { env } from "@src/env";

const verifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type VerifyBody = z.infer<typeof verifySchema>;

export const POST = withValidation(
  { body: verifySchema },
  async (request, _ctx, { body }) => {
    const { code } = body as VerifyBody;

    const mfaCookie = request.cookies.get("mfa_temp_token");

    if (!mfaCookie?.value) {
      return NextResponse.json(
        { success: false, message: "Session expired. Please sign in again" },
        { status: 400 },
      );
    }

    let payload;
    try {
      payload = await verifyPasswordResetToken(mfaCookie.value);
    } catch {
      return NextResponse.json(
        { success: false, message: "Session expired. Please sign in again" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "User not found or inactive" },
        { status: 401 },
      );
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
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification code" },
        { status: 401 },
      );
    }

    if (verificationCode.attempts >= env.OTP_MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many attempts. Please request a new code",
        },
        { status: 429 },
      );
    }

    if (verificationCode.code !== hashedCode) {
      await prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } },
      });

      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 401 },
      );
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

    const response = NextResponse.json({
      success: true,
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

