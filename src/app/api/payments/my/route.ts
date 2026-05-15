import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { PaymentHistoryQuerySchema } from "@src/features/payments/validators";

export const GET = withAssociation(
  { query: PaymentHistoryQuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.MEMBER);
    const userId = request.headers.get("x-user-id")!;

    const { page = 1, pageSize = 20 } = query || {};
    const skip = (page - 1) * pageSize;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          userId,
          associationId: association.id,
        },
        orderBy: { paymentDate: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.payment.count({
        where: {
          userId,
          associationId: association.id,
        },
      }),
    ]);

    return SuccessResponse({
      data: payments,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
);
