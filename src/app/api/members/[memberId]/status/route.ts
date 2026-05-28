import { UserRole, UserStatus } from "@prisma/client";
import { withAssociation, withRole } from "@src/shared/api";
import { NotFoundError, UnauthorizedError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";
import { logger } from "@src/shared/logger";

const UpdateUserStatusSchema = z.object({
  status: z.enum(UserStatus),
});

const UpdateUserStatusParamsSchema = z.object({
  memberId: z.uuid(),
});

export const PATCH = withAssociation(
  { body: UpdateUserStatusSchema, params: UpdateUserStatusParamsSchema },
  async (association, { body, params, traceId }, req) => {
    logger.info("PATCH /api/members/[memberId]/status - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(req, UserRole.PRESIDENT);

    logger.info("PATCH /api/members/[memberId]/status - User authorized", {
      traceId,
      userId: user.id,
    });

    const memberId = params?.memberId;

    if (!memberId) throw new UnauthorizedError("Unauthorized");

    const target = await prisma.user.findUnique({
      where: { id: memberId, associationId: association.id },
    });

    if (!target)
      throw new NotFoundError("User does not exist in the association");

    const updatedUser = await prisma.user.update({
      where: { id: memberId },
      data: { status: body?.status },
      select: { id: true, status: true, email: true },
    });

    logger.info("PATCH /api/members/[memberId]/status - Success", {
      traceId,
      memberId,
      status: body?.status,
    });

    return SuccessResponse({
      data: updatedUser,
      message: "User status updated successfully",
    });
  },
);
