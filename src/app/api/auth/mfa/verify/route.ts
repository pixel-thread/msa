import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { requireAuth } from "@src/shared/api/auth";
import { hashToken } from "@src/shared/lib/password";
import { env } from "@src/env";

const verifyMfaSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type VerifyMfaBody = z.infer<typeof verifyMfaSchema>;

export const POST = withValidation(
  { body: verifyMfaSchema },
  async (_, { body }) => {
    const { userId } = await requireAuth();
    
    const { code } = body as VerifyMfaBody;

    const hashedCode = hashToken(code);
    
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId,
        type: "SETUP_MFA",
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
        { success: false, message: "Too many attempts. Please request a new code" },
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

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return NextResponse.json({
      success: true,
      message: "MFA enabled successfully",
      data: {
        mfaEnabled: true,
      },
    });
  }
);