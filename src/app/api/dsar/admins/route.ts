import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { UserRole } from '@prisma/client';
import { findAssociationAdmins } from '@src/features/dsar/services';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation({}, async (association, { traceId }, request) => {
  logger.info(
    {
      traceId,
      associationId: association.id,
    },
    'GET /api/dsar/admins - Request started',
  );

  const user = await withRole(request, UserRole.DPO);

  logger.info(
    {
      traceId,
      userId: user.id,
    },
    'GET /api/dsar/admins - User authorized',
  );

  const admins = await findAssociationAdmins(association.id);

  logger.info(
    {
      traceId,
      count: admins.length,
    },
    'GET /api/dsar/admins - Success',
  );

  return SuccessResponse({ data: admins });
});
