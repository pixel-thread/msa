import { withAssociation } from '@src/shared/api';
import { ConsentService, ConsentUpdateSchema } from '@src/features/consent';
import { ConsentStatus } from '@prisma/client';
import { SuccessResponse } from '@src/shared/utils';
import { BadRequestError, UnauthorizedError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';

/**
 * POST /api/consent/revoke
 *
 * Revokes consent for specific purposes.
 */
export const POST = withAssociation(
  {
    body: ConsentUpdateSchema.omit({ action: true }),
  },
  async (association, { body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'POST /api/consent/revoke - Request started',
    );

    const userId = request.headers.get('x-user-id');
    if (!userId) throw new UnauthorizedError('Unauthorized');
    if (!body) {
      throw new BadRequestError('Request body is required');
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const receipts = await ConsentService.updateConsent(
      userId,
      association.id,
      {
        ...body,
        action: ConsentStatus.WITHDRAWN,
      },
      ipAddress,
      userAgent,
    );

    logger.info(
      {
        traceId,
        userId,
      },
      'POST /api/consent/revoke - Consent revoked successfully',
    );

    return SuccessResponse({
      message: 'Consent revoked successfully',
      data: receipts,
    });
  },
);
