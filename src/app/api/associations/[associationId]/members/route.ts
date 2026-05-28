import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import z from "zod";
import { logger } from "@src/shared/logger";

const BodySchema = z.object({
  memberId: z.string(),
});
const ParamsSchema = z.object({
  associationId: z.uuid(),
});

export const POST = withAssociation(
  { body: BodySchema, params: ParamsSchema },
  async (association, { body, params, traceId }, request) => {
    logger.info("POST /api/associations/[associationId]/members - Request started", { traceId, targetMemberId: body?.memberId, associationId: params?.associationId });
    const user = await withRole(request as NextRequest, UserRole.PRESIDENT);
    logger.info("POST /api/associations/[associationId]/members - User authorized", { traceId, userId: user.id, roles: user.role });

    if (!body?.memberId) {
      logger.error("POST /api/associations/[associationId]/members - memberId is required", { traceId });
      throw new ValidationError("memberId is required");
    }

    const existingMember = await prisma.user.findUnique({
      where: { id: body.memberId },
    });

    if (!existingMember) {
      logger.error("POST /api/associations/[associationId]/members - Member not found", { traceId, targetMemberId: body.memberId });
      throw new NotFoundError("Member not found");
    }

    if (existingMember.associationId === params?.associationId) {
      logger.error("POST /api/associations/[associationId]/members - Member already in this association", { traceId, targetMemberId: body.memberId, associationId: params?.associationId });
      throw new ConflictError("Member already in this association");
    }

    const updatedMember = await prisma.user.update({
      where: { id: body.memberId },
      data: { associationId: association.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        membershipNumber: true,
        associationId: true,
      },
    });

    logger.info("POST /api/associations/[associationId]/members - Success", { traceId, targetMemberId: body.memberId, associationId: association.id });

    return SuccessResponse({ data: updatedMember }, 201);
  },
);
