import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { UserRole } from '@prisma/client';
import { getDsarSlaStatus } from '@src/features/dsar/services';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation({}, async (association, { traceId }, request) => {
  logger.info(
    {
      traceId,
      associationId: association.id,
    },
    'GET /api/dsar/sla-report - Request started',
  );

  const user = await withRole(request, UserRole.DPO);

  logger.info(
    {
      traceId,
      userId: user.id,
    },
    'GET /api/dsar/sla-report - User authorized',
  );

  const report = await getDsarSlaStatus(association.id);

  logger.info({ traceId }, 'GET /api/dsar/sla-report - Success');

  return SuccessResponse({ data: report, message: '' });
});
