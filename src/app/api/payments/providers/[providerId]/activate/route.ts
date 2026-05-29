import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger/server';
import { ProviderIdParamSchema } from '@src/features/payments/validators';
import {
  getProviderById,
  setActiveProvider,
} from '@src/features/payments/services/payment-provider.service';
import { UserRole } from '@prisma/client';
import { BadRequestError, NotFoundError } from '@src/shared/errors';

export const POST = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params, traceId }, req) => {
    logger.info(
      { traceId, providerId: params?.providerId },
      'POST /api/payments/providers/[providerId]/activate - Request started',
    );

    await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, providerId: params?.providerId },
      'POST /api/payments/providers/[providerId]/activate - User authorized',
    );

    const providerId = params?.providerId;

    if (!providerId) throw new BadRequestError('Invalid provider ID');

    const provderExist = await getProviderById(providerId, association.id);

    if (!provderExist) {
      throw new NotFoundError('Provider not found');
    }

    logger.info(
      { traceId, providerId },
      'POST /api/payments/providers/[providerId]/activate - Toggling provider activation',
    );
    const result = await setActiveProvider(provderExist.id, association.id);

    const activatedMessage = 'Provider successfully activated';
    const deActivatedMessage = 'Provider successfully de-activated';
    logger.info(
      { traceId, providerId, isActive: result.isActive },
      'POST /api/payments/providers/[providerId]/activate - Success',
    );

    return SuccessResponse({
      data: result,
      message: result.isActive ? activatedMessage : deActivatedMessage,
    });
  },
);
