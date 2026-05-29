import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { getUserPaymentHistory } from '@feature/payments/services/payment.service';
import { getUserContributionSummary } from '@feature/payments/services/contribution.service';
import { UserRole } from '@prisma/client';
import { LedgerQueryParams, LedgerRouteParams } from '@src/features/ledger/validators';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation(
  { params: LedgerRouteParams, query: LedgerQueryParams },
  async (association, { query, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'GET /api/members/[memberId]/ledger - Request started',
    );

    const user = await withRole(request, UserRole.FINANCE);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'GET /api/members/[memberId]/ledger - User authorized',
    );

    const userId = request.headers.get('x-user-id')!;
    const page = query?.page ?? 1;

    const [history, summary] = await Promise.all([
      getUserPaymentHistory(userId, page),
      getUserContributionSummary(userId),
    ]);

    logger.info(
      {
        traceId,
        count: history.transactions.length,
      },
      'GET /api/members/[memberId]/ledger - Success',
    );

    return SuccessResponse({
      data: {
        transactions: history.transactions,
        summary,
      },
      meta: history.pagination,
    });
  },
);
