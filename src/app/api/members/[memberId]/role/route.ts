import { UserRole } from "@prisma/client";
import { withAssociation, withRole } from "@src/shared/api";
import { ConflictError, NotFoundError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";

const UpdateUserRoleSchema = z.object({
  role: z.enum(UserRole),
});

const UpdateUserRoleParamsSchema = z.object({
  memberId: z.uuid(),
});

export const POST = withAssociation(
  { body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema },
  async (association, { body, params }, req) => {
    await withRole(req, UserRole.PRESIDENT);

    const user = await prisma.user.findUnique({
      where: { id: params?.memberId, associationId: association.id },
    });

    if (!user)
      throw new NotFoundError("User does not exist in the association");

    const userRole = user.role;

    const newRole = body?.role as UserRole;

    if (userRole.includes(newRole)) {
      throw new ConflictError("User already has the role");
    }
    const updatedUser = await prisma.user.update({
      where: { id: params?.memberId },
      data: { role: [...userRole, newRole] },
      select: { id: true, role: true, email: true },
    });

    return SuccessResponse({
      data: updatedUser,
      message: "User role updated successfully",
    });
  },
);

export const PUT = withAssociation(
  { body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema },
  async (association, { body, params }, req) => {
    await withRole(req, UserRole.PRESIDENT);

    const user = await prisma.user.findUnique({
      where: { id: params?.memberId, associationId: association.id },
    });

    if (!user)
      throw new NotFoundError("User does not exist in the association");

    const userRole = user.role;

    const removeRole = body?.role as UserRole;

    if (!userRole.includes(removeRole)) {
      throw new ConflictError("User does not have the role");
    }

    const updatedUser = await prisma.user.update({
      where: { id: params?.memberId },
      data: { role: userRole.filter((role) => role !== removeRole) },
      select: { id: true, role: true, email: true },
    });

    return SuccessResponse({
      data: updatedUser,
      message: "User role updated successfully",
    });
  },
);
