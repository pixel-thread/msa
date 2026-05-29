import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';
import { findPaymentTransactions } from '@src/features/payments/services/findPaymentTransactions';
import { PaymentHistoryQuerySchema } from '@src/features/payments/validators';

export const GET = withAssociation(
  { query: PaymentHistoryQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info({ traceId, query }, 'GET /api/payments/my - Request started');

    const user = await withRole(request, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'GET /api/payments/my - User authorized');
    const userId = request.headers.get('x-user-id')!;

    const { page = 1, pageSize = 20 } = query || {};
    const skip = (page - 1) * pageSize;

    const { transactions: payments, total } = await findPaymentTransactions({
      where: {
        userId,
        associationId: association.id,
      },
      page,
      pageSize,
    });

    logger.info({ traceId, count: payments.length, total }, 'GET /api/payments/my - Success');

    return SuccessResponse({
      data: payments,
      meta: buildPagination(total, page, pageSize),
    });
  },
);
