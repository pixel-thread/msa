import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';
import { GetTransactionsQuerySchema } from '@src/features/payments/validators';
import { getAllTransactions } from '@src/features/payments/services/payment.service';

export const GET = withAssociation(
  { query: GetTransactionsQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info({ traceId, query }, 'GET /api/payments - Request started');

    await withRole(request, UserRole.FINANCE);
    logger.info({ traceId }, 'GET /api/payments - User authorized');

    const result = await getAllTransactions(association.id, (query as any) || {});

    logger.info({ traceId, count: result.transactions.length }, 'GET /api/payments - Success');

    return SuccessResponse({
      data: result.transactions,
      meta: result.pagination,
    });
  },
);
