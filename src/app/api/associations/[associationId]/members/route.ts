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

const BodySchema = z.object({
  memberId: z.string(),
});
const ParamsSchema = z.object({
  associationId: z.uuid(),
});

export const POST = withAssociation(
  { body: BodySchema, params: ParamsSchema },
  async (association, { body, params }, request) => {
    await withRole(request as NextRequest, UserRole.PRESIDENT);

    if (!body?.memberId) {
      throw new ValidationError("memberId is required");
    }

    const existingMember = await prisma.user.findUnique({
      where: { id: body.memberId },
    });

    if (!existingMember) {
      throw new NotFoundError("Member not found");
    }

    if (existingMember.associationId === params?.associationId) {
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

    return SuccessResponse({ data: updatedMember }, 201);
  },
);
