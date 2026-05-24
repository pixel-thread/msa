import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { verifyPassword } from "@src/shared/lib/password";
import { BadRequestError, UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

const DisableMfaSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type DisableMfaBody = z.infer<typeof DisableMfaSchema>;

export const POST = withValidation(
  { body: DisableMfaSchema },
  async (request, _ctx, { body }) => {
    const userId = request.headers.get("x-user-id");

    if (!userId) throw new UnauthorizedError("Unauthorized");

    const { password } = body as DisableMfaBody;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, mfaEnabled: true },
    });

    if (!user || !user.mfaEnabled) {
      throw new BadRequestError("MFA is not enabled");
    }

    if (!user.password) {
      throw new BadRequestError("Please set a password first");
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      throw new UnauthorizedError("Invalid password");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false },
    });

    return SuccessResponse({
      message: "MFA disabled successfully",
      data: { mfaEnabled: false },
    });
  },
);
