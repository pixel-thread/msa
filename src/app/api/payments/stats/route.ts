import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';
import { getFinancialStats } from '@feature/payments/services/payment.service';

/**
 * GET /api/payments/stats
 *
 * Summary statistics for the association's financial health.
 *
 * Role: FINANCE+
 */
export const GET = withAssociation({}, async (association, { traceId }, request) => {
  logger.info({ traceId }, 'GET /api/payments/stats - Request started');

  await withRole(request, UserRole.FINANCE);
  logger.info({ traceId }, 'GET /api/payments/stats - User authorized');

  const data = await getFinancialStats(association.id);

  logger.info({ traceId }, 'GET /api/payments/stats - Success');

  return SuccessResponse({ data: data.stats, meta: data.pagination });
});
