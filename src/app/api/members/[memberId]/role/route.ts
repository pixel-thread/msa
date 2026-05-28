import { UserRole } from "@prisma/client";
import { withAssociation, withRole } from "@src/shared/api";
import { ConflictError, NotFoundError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";
import { logger } from "@src/shared/logger";

const UpdateUserRoleSchema = z.object({
  role: z.enum(UserRole),
});

const UpdateUserRoleParamsSchema = z.object({
  memberId: z.uuid(),
});

export const POST = withAssociation(
  { body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema },
  async (association, { body, params, traceId }, req) => {
    logger.info("POST /api/members/[memberId]/role - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(req, UserRole.PRESIDENT);

    logger.info("POST /api/members/[memberId]/role - User authorized", {
      traceId,
      userId: user.id,
    });

    const target = await prisma.user.findUnique({
      where: { id: params?.memberId, associationId: association.id },
    });

    if (!target)
      throw new NotFoundError("User does not exist in the association");

    const userRole = target.role;

    const newRole = body?.role as UserRole;

    if (userRole.includes(newRole)) {
      throw new ConflictError("User already has the role");
    }
    const updatedUser = await prisma.user.update({
      where: { id: params?.memberId },
      data: { role: [...userRole, newRole] },
      select: { id: true, role: true, email: true },
    });

    logger.info("POST /api/members/[memberId]/role - Success", {
      traceId,
      memberId: params?.memberId,
      newRole,
    });

    return SuccessResponse({
      data: updatedUser,
      message: "User role updated successfully",
    });
  },
);

export const PUT = withAssociation(
  { body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema },
  async (association, { body, params, traceId }, req) => {
    logger.info("PUT /api/members/[memberId]/role - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(req, UserRole.PRESIDENT);

    logger.info("PUT /api/members/[memberId]/role - User authorized", {
      traceId,
      userId: user.id,
    });

    const target = await prisma.user.findUnique({
      where: { id: params?.memberId, associationId: association.id },
    });

    if (!target)
      throw new NotFoundError("User does not exist in the association");

    const userRole = target.role;

    const removeRole = body?.role as UserRole;

    if (!userRole.includes(removeRole)) {
      throw new ConflictError("User does not have the role");
    }

    const updatedUser = await prisma.user.update({
      where: { id: params?.memberId },
      data: { role: userRole.filter((role) => role !== removeRole) },
      select: { id: true, role: true, email: true },
    });

    logger.info("PUT /api/members/[memberId]/role - Success", {
      traceId,
      memberId: params?.memberId,
      removeRole,
    });

    return SuccessResponse({
      data: updatedUser,
      message: "User role updated successfully",
    });
  },
);
