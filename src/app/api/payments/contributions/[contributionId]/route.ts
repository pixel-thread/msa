import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { NotFoundError } from "@src/shared/errors";

const ParamsSchema = z.object({
  contributionId: z.string().uuid("Invalid contribution ID"),
});

export const GET = withAssociation(
  { params: ParamsSchema },
  async (association, { params }) => {
    const contribution = await prisma.contributionPeriod.findFirst({
      where: {
        id: params!.contributionId,
        associationId: association.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            membershipNumber: true,
          },
        },
        allocations: {
          include: {
            paymentTransaction: {
              select: {
                id: true,
                amount: true,
                method: true,
                status: true,
                paidAt: true,
                receiptNumber: true,
              },
            },
          },
        },
      },
    });

    if (!contribution) {
      throw new NotFoundError("Contribution not found");
    }

    return SuccessResponse({ data: contribution });
  },
);
