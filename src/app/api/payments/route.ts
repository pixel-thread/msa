import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { logger } from "@src/shared/logger";
import { UserRole } from "@prisma/client";
import { GetTransactionsQuerySchema } from "@src/features/payments/validators";
import { getAllTransactions } from "@src/features/payments/services/payment.service";

export const GET = withAssociation(
  { query: GetTransactionsQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info("GET /api/payments - Request started", { traceId, query });

    await withRole(request, UserRole.FINANCE);
    logger.info("GET /api/payments - User authorized", { traceId });

    const result = await getAllTransactions(
      association.id,
      (query as any) || {},
    );

    logger.info("GET /api/payments - Success", { traceId, count: result.transactions.length });

    return SuccessResponse({
      data: result.transactions,
      meta: result.pagination,
    });
  },
);
