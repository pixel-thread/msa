import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse, ErrorResponse } from "@src/shared/utils/responses";
import { NotFoundError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";

export const GET = withAssociation(
  { params: null },
  async (association, { params }) => {
    const member = await prisma.user.findFirst({
      where: {
        id: params.memberId,
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
        userId: params.memberId,
        type: "SUBSCRIPTION",
        status: "COMPLETED",
      },
      orderBy: { paymentDate: "desc" },
    });

    return SuccessResponse({
      member: {
        ...member,
        hasPaid: !!subscription,
        lastPaymentDate: subscription?.paymentDate,
      },
    });
  },
);