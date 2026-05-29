import { UserRole } from '@prisma/client';
import { findUniqueAssociation } from '@src/features/associations/services/findUniqueAssociation';
import { withAssociation, withRole } from '@src/shared/api';
import { logger } from '@src/shared/logger/server';
import { SuccessResponse } from '@src/shared/utils';

export const GET = withAssociation({}, async (association, { traceId }, req) => {
  logger.info({ traceId }, 'GET /api/associations - Request started');
  const user = await withRole(req, UserRole.MEMBER);
  logger.info(
    { traceId, userId: user.id, roles: user.role },
    'GET /api/associations - User authorized',
  );

  const currentAssociation = await findUniqueAssociation({
    where: { id: association.id },
  });

  logger.info({ traceId, associationId: association.id }, 'GET /api/associations - Success');

  return SuccessResponse({
    data: currentAssociation,
  });
});
