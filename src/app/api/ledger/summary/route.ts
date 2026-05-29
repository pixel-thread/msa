import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { getSummary } from '@src/features/ledger/services/ledger.service';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation({}, async (association, { traceId }, request) => {
  logger.info({ traceId, associationId: association.id }, 'GET /api/ledger/summary - Request started');

  await withRole(request, UserRole.FINANCE);

  const data = await getSummary(association.id);

  logger.info({ traceId, count: data.accounts.length }, 'GET /api/ledger/summary - Success');

  return SuccessResponse({ data });
});
