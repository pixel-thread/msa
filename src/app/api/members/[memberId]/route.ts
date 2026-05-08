import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError, NotFoundError, ValidationError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { withRole } from "@src/shared/api/with-role";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import z from "zod";

const ParamSchema = z.object({
  memberId: z.string(),
});
export const GET = withAssociation(
  { params: ParamSchema },
  async (association, { params }) => {
    const member = await prisma.user.findFirst({
      where: {
        id: params?.memberId,
        associationId: association.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        membershipNumber: true,
        designation: true,
        mobile: true,
        dateOfJoiningGovt: true,
        dateOfJoiningMfsa: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            payments: true,
            meetingAttendances: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    const subscription = await prisma.payment.findFirst({
      where: {
        userId: params?.memberId,
        type: "SUBSCRIPTION",
        status: "COMPLETED",
      },
      orderBy: { paymentDate: "desc" },
    });

    return SuccessResponse({
      data: {
        ...member,
        hasPaid: !!subscription,
        lastPaymentDate: subscription?.paymentDate,
      },
    });
  },
);

const ChangeOrgSchema = z.object({
  associationId: z.string().uuid(),
});

export const PATCH = withAssociation(
  { params: ParamSchema, body: ChangeOrgSchema },
  async (currentAssociation, { params, body }, request) => {
    const user = await withRole(request, UserRole.PRESIDENT);

    const allowedRoles: UserRole[] = [UserRole.PRESIDENT, UserRole.SUPER_ADMIN];
    if (!allowedRoles.includes(user.role)) {
      throw new ValidationError("Insufficient permissions to change organization");
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: params?.memberId,
        associationId: currentAssociation.id,
      },
    });

    if (!targetUser) {
      throw new NotFoundError("Member not found");
    }

    const newAssociation = await prisma.association.findUnique({
      where: { id: body.associationId },
    });

    if (!newAssociation) {
      throw new NotFoundError("Target association not found");
    }

    const updatedMember = await prisma.user.update({
      where: { id: params?.memberId },
      data: { associationId: body.associationId },
      select: {
        id: true,
        name: true,
        email: true,
        associationId: true,
      },
    });

    return SuccessResponse({ data: updatedMember });
  },
);

