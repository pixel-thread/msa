import { withAssociation, withRole } from '@src/shared/api';
import { ConsentService } from '@src/features/consent';
import { SuccessResponse } from '@src/shared/utils';
import { UserRole } from '@prisma/client';
import { logger } from '@src/shared/logger/server';

/**
 * GET /api/consent/report
 *
 * Retrieves the consent report for the association.
 * Roles: DPO, PRESIDENT, SUPER_ADMIN
 */
export const GET = withAssociation({}, async (association, { traceId }, req) => {
  logger.info(
    {
      traceId,
      associationId: association.id,
    },
    'GET /api/consent/report - Request started',
  );

  const user = await withRole(req, UserRole.DPO);

  logger.info(
    {
      traceId,
      userId: user.id,
    },
    'GET /api/consent/report - User authorized',
  );

  const report = await ConsentService.getConsentReport(association.id);

  logger.info({ traceId }, 'GET /api/consent/report - Success');

  return SuccessResponse({
    data: report,
  });
});
