import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import z from "zod";
import { UnauthorizedError, ValidationError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

const LinkNotificationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const POST = withValidation(
  { body: LinkNotificationSchema },
  async (req, _ctx, { body }) => {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      throw new UnauthorizedError("User ID is required");
    }

    if (!body?.token) {
      throw new ValidationError("Token is required");
    }

    const pushToken = await prisma.pushToken.upsert({
      where: { token: body.token },
      update: {
        userId: userId,
        updatedAt: new Date(),
      },
      create: {
        token: body.token,
        userId: userId,
      },
    });

    return SuccessResponse({ data: pushToken }, 201);
  },
);
