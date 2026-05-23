import { UserRole, UserStatus } from "@prisma/client";
import { withAssociation, withRole } from "@src/shared/api";
import { NotFoundError, UnauthorizedError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";

const UpdateUserStatusSchema = z.object({
  status: z.enum(UserStatus),
});

const UpdateUserStatusParamsSchema = z.object({
  memberId: z.uuid(),
});

export const PATCH = withAssociation(
  { body: UpdateUserStatusSchema, params: UpdateUserStatusParamsSchema },
  async (association, { body, params }, req) => {
    await withRole(req, UserRole.PRESIDENT);

    const userId = params?.memberId;

    if (!userId) throw new UnauthorizedError("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { id: userId, associationId: association.id },
    });

    if (!user)
      throw new NotFoundError("User does not exist in the association");

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: body?.status },
      select: { id: true, status: true, email: true },
    });

    return SuccessResponse({
      data: updatedUser,
      message: "User status updated successfully",
    });
  },
);
