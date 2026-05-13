import { UserRole } from "@prisma/client";
import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { ConflictError, NotFoundError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";

const UpdateUserRoleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(UserRole),
});

export const POST = withAssociation(
  { body: UpdateUserRoleSchema },
  async (association, { body }, req) => {
    await withRole(req, UserRole.PRESIDENT);

    const user = await prisma.user.findUnique({
      where: { id: body?.userId, associationId: association.id },
    });

    if (!user)
      throw new NotFoundError("User does not exist in the association");
    const userRole = user.role;
    const newRole = body?.role as UserRole;
    if (userRole.includes(newRole)) {
      throw new ConflictError("User already has the role");
    }
    const updatedUser = await prisma.user.update({
      where: { id: body?.userId },
      data: { role: [...userRole, newRole] },
      select: { id: true, role: true, email: true },
    });

    return SuccessResponse({
      data: updatedUser,
      message: "User role updated successfully",
    });
  },
);
