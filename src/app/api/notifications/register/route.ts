import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import z from "zod";
import { ValidationError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import { logger } from "@src/shared/logger";

const RegisterPushTokenSchema = z.object({
  token: z.string(),
});

export const POST = withValidation(
  { body: RegisterPushTokenSchema },
  async (_req, _ctx, { body, traceId }) => {
    logger.info("POST /api/notifications/register - Request started", { traceId });

    const token = body?.token;

    if (!token) {
      throw new ValidationError("Missing token");
    }

    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: { updatedAt: new Date() },
      create: { token },
    });

    logger.info("POST /api/notifications/register - Success", { traceId, tokenId: pushToken.id });

    return SuccessResponse({ data: pushToken });
  },
);
