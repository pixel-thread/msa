import { UserRole } from '@prisma/client';
import {
  getActiveProvider,
  getProvidersByAssociation,
} from '@src/features/payments/services/payment-provider.service';
import { withAssociation, withRole } from '@src/shared/api';
import { logger } from '@src/shared/logger/server';
import { NotFoundError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';

export const GET = withAssociation({}, async (association, { traceId }, req) => {
  logger.info({ traceId }, 'GET /api/payments/providers/status - Request started');

  const user = await withRole(req, UserRole.MEMBER);
  logger.info({ traceId, userId: user.id }, 'GET /api/payments/providers/status - User authorized');

  const providerByAssociation = await getProvidersByAssociation(association.id);

  if (!providerByAssociation) {
    throw new NotFoundError('No Provider setup');
  }

  const activeProvider = await getActiveProvider(association.id);

  if (!activeProvider) {
    throw new NotFoundError('Provider not found');
  }

  logger.info(
    { traceId, isActive: activeProvider.isActive },
    'GET /api/payments/providers/status - Success',
  );

  return SuccessResponse({
    data: { status: activeProvider.isActive },
  });
});
