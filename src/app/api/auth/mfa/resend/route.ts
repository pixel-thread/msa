import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { requireAuth } from "@src/shared/api/auth";
import { generateOTP, hashToken } from "@src/shared/lib/password";
import { sendVerificationEmail } from "@src/shared/lib/email";
import { env } from "@src/env";
import { ForbiddenError, NotFoundError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import { logger } from "@src/shared/logger";

export const POST = withValidation({}, async () => {
  const { userId } = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const lastCode = await prisma.verificationCode.findFirst({
    where: {
      userId,
      type: "SETUP_MFA",
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (lastCode) {
    const timeSinceLastCode = Date.now() - lastCode.createdAt.getTime();
    const cooldownMs = env.OTP_RESEND_COOLDOWN * 1000;

    if (timeSinceLastCode < cooldownMs) {
      const remainingSeconds = Math.ceil(
        (cooldownMs - timeSinceLastCode) / 1000,
      );
      throw new ForbiddenError(
        `Please wait ${remainingSeconds} seconds before requesting a new code`,
      );
    }
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

  if (env.NODE_ENV === "production") {
    await sendVerificationEmail(user.email, otp, "SETUP_MFA");
  }

  if (env.NODE_ENV === "development") {
    logger.debug("OTP sent to ", { otp });
  }

  return SuccessResponse({
    message: "Verification code sent to your email",
    data: {
      codeSent: true,
    },
  });
});

