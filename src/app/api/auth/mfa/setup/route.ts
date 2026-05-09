import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { requireAuth } from "@src/shared/api/auth";
import { verifyPassword } from "@src/shared/lib/password";
import { generateOTP, hashToken } from "@src/shared/lib/password";
import { sendVerificationEmail } from "@src/shared/lib/email";
import { env } from "@src/env";
import {
  BadRequestError,
  ConflictError,
  ValidationError,
} from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

const setupMfaSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type SetupMfaBody = z.infer<typeof setupMfaSchema>;

export const POST = withValidation(
  { body: setupMfaSchema },
  async (_, _ctx, { body }) => {
    const { userId } = await requireAuth();

    const { password } = body as SetupMfaBody;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, mfaEnabled: true },
    });

    if (!user || !user.password) {
      throw new BadRequestError("Please set a password first");
    }

    if (user.mfaEnabled) {
      throw new ConflictError("MFA is already enabled");
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      throw new ValidationError("Invalid password");
    }

    const otp = generateOTP(env.OTP_LENGTH);
    const hashedOTP = hashToken(otp);

    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

    await prisma.verificationCode.create({
      data: {
        userId,
        code: hashedOTP,
        type: "SETUP_MFA",
        expiresAt: otpExpiry,
      },
    });

    const authUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (authUser) {
      await sendVerificationEmail(authUser.email, otp, "SETUP_MFA");
    }

    return SuccessResponse({
      message: "Verification code sent to your email",
      data: {
        pending: true,
        codeSent: true,
      },
    });
  },
);

