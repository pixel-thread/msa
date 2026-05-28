import { withValidation } from "@src/shared/api";
import {
  verifyMfaTempToken,
  signAccessToken,
  signRefreshToken,
} from "@src/shared/lib/jwt";
import { hashToken } from "@src/shared/lib/password";
import { env } from "@src/env";
import {
  BadRequestError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import {
  VerifySignInInput,
  VerifySignInSchema,
} from "@src/features/auth/validators";
import { getUniqueUser } from "@src/shared/services/user/get-unique-user";
import { getVerificationCodeFirst } from "@src/features/auth/services/get-verification-code-first";
import { updateVerificationCode } from "@src/features/auth/services/update-verification-code";
import { createRefreshToken } from "@src/features/auth/services/create-refresh-token";
import { logger } from "@src/shared/logger";

export const POST = withValidation(
  { body: VerifySignInSchema },
  async (request, _ctx, { body, traceId }) => {
    logger.info("POST /api/auth/sign-in/verify - Request started", { traceId });
    const { code } = body as VerifySignInInput;

    const mfaCookie =
      request.cookies.get("mfa_temp_token")?.value || body?.mfa_temp_token;

    if (!mfaCookie) {
      logger.error("POST /api/auth/sign-in/verify - Session expired (missing mfa_temp_token cookie/body)", { traceId });
      throw new BadRequestError("Session expired. Please signin again");
    }

    let payload;
    try {
      payload = await verifyMfaTempToken(mfaCookie);
    } catch {
      logger.error("POST /api/auth/sign-in/verify - Session expired (failed payload verification)", { traceId });
      throw new BadRequestError("Session expired. Please signin again");
    }

    const user = await getUniqueUser({
      where: { id: payload.sub },
    });

    if (!user || user.status !== "ACTIVE") {
      logger.error("POST /api/auth/sign-in/verify - User not found or inactive", { traceId, userId: payload.sub });
      throw new UnauthorizedError("User not found or inactive");
    }

    const hashedCode = hashToken(code);

    const verificationCode = await getVerificationCodeFirst({
      where: {
        userId: user.id,
        type: "LOGIN_MFA",
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verificationCode) {
      logger.error("POST /api/auth/sign-in/verify - Invalid or expired verification code", { traceId, userId: user.id });
      throw new UnauthorizedError("Invalid or expired verification code");
    }

    if (verificationCode.attempts >= env.OTP_MAX_ATTEMPTS) {
      logger.error("POST /api/auth/sign-in/verify - Too many attempts", { traceId, userId: user.id, verificationCodeId: verificationCode.id });
      throw new TooManyRequestsError(
        "Too many attempts. Please request a new code",
      );
    }

    if (verificationCode.code !== hashedCode) {
      await updateVerificationCode({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } },
      });

      logger.error("POST /api/auth/sign-in/verify - Invalid verification code input", { traceId, userId: user.id });
      throw new UnauthorizedError("Invalid verification code");
    }

    await updateVerificationCode({
      where: { id: verificationCode.id },
      data: { usedAt: new Date() },
    });

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);
    const hashedRefreshToken = hashToken(refreshToken);

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await createRefreshToken({
      data: {
        user: { connect: { id: user.id } },
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
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
      path: "/",
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.delete("mfa_temp_token");

    logger.info("POST /api/auth/sign-in/verify - Success", { traceId, userId: user.id });

    return response;
  },
);
