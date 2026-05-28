import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { buildPagination } from "@src/shared/utils/build-pagination";
import { logger } from "@src/shared/logger";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { PaymentHistoryQuerySchema } from "@src/features/payments/validators";

export const GET = withAssociation(
  { query: PaymentHistoryQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info("GET /api/payments/my - Request started", { traceId, query });

    const user = await withRole(request, UserRole.MEMBER);
    logger.info("GET /api/payments/my - User authorized", { traceId, userId: user.id });
    const userId = request.headers.get("x-user-id")!;

    const { page = 1, pageSize = 20 } = query || {};
    const skip = (page - 1) * pageSize;

    const [payments, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where: {
          userId,
          associationId: association.id,
        },
        orderBy: { paymentDate: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.paymentTransaction.count({
        where: {
          userId,
          associationId: association.id,
        },
      }),
    ]);

    logger.info("GET /api/payments/my - Success", { traceId, count: payments.length, total });

    return SuccessResponse({
      data: payments,
      meta: buildPagination(total, page, pageSize),
    });
  },
);
