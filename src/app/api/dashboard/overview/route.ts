import { withAssociation } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { getDashboardOverview } from '@feature/dashboard/services/dashboard.service';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation({}, async (association, { traceId }) => {
  logger.info(
    {
      traceId,
      associationId: association.id,
    },
    'GET /api/dashboard/overview - Request started',
  );

  const data = await getDashboardOverview(association.id);

  logger.info({ traceId }, 'GET /api/dashboard/overview - Success');

  return SuccessResponse({ data });
});
