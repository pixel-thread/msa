import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import z from "zod";
import { ValidationError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

const RegisterPushTokenSchema = z.object({
  token: z.string(),
});
export const POST = withValidation(
  { body: RegisterPushTokenSchema },
  async (_req, _ctx, { body }) => {
    const token = body?.token;

    if (!token) {
      throw new ValidationError("Missing token");
    }

    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: { updatedAt: new Date() },
      create: { token },
    });

    return SuccessResponse({ data: pushToken });
  },
);
