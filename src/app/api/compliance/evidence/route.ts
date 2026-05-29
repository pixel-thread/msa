import { withAssociation, withRole } from '@src/shared/api';
import { UserRole } from '@prisma/client';
import { generateComplianceEvidence } from '@src/features/compliance/services';
import { SuccessResponse } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation({}, async (association, { traceId }, request) => {
  logger.info(
    { traceId, associationId: association.id },
    'GET /api/compliance/evidence - Request started',
  );
  const user = await withRole(request, UserRole.DPO);
  logger.info(
    { traceId, userId: user.id, roles: user.role },
    'GET /api/compliance/evidence - User authorized',
  );

  const evidence = await generateComplianceEvidence(association.id, 30);

  logger.info({ traceId, associationId: association.id }, 'GET /api/compliance/evidence - Success');

  return SuccessResponse({
    data: evidence,
  });
});
