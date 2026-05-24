import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { hashToken } from "@src/shared/lib/password";
import { env } from "@src/env";
import { TooManyRequestsError, UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

const VerifyMfaSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type VerifyMfaBody = z.infer<typeof VerifyMfaSchema>;

export const POST = withValidation(
  { body: VerifyMfaSchema },
  async (request, _ctx, { body }) => {
    const userId = request.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

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

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return SuccessResponse({
      message: "MFA enabled successfully",
      data: { mfaEnabled: true },
    });
  },
);
