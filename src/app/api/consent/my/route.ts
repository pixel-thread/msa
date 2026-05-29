import { withAssociation, withRole } from '@src/shared/api';
import { ConsentService } from '@src/features/consent';
import { SuccessResponse } from '@src/shared/utils';
import { UserRole } from '@prisma/client';
import { UnauthorizedError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';

/**
 * GET /api/consent/my
 *
 * Retrieves the current consent state for the authenticated user.
 */
export const GET = withAssociation({}, async (association, { traceId }, req) => {
  logger.info(
    {
      traceId,
      associationId: association.id,
    },
    'GET /api/consent/my - Request started',
  );

  const user = await withRole(req, UserRole.MEMBER);

  logger.info(
    {
      traceId,
      userId: user.id,
    },
    'GET /api/consent/my - User authorized',
  );

  const userId = req.headers.get('x-user-id');

  if (!userId) throw new UnauthorizedError('User ID not found');

  const consentState = await ConsentService.getUserConsentState(userId, association.id);

  logger.info({ traceId }, 'GET /api/consent/my - Success');

  return SuccessResponse({
    data: consentState,
  });
});
