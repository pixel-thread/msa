import { withAssociation, withRole } from '@src/shared/api';
import { ConsentService } from '@src/features/consent';
import { buildPagination, SuccessResponse } from '@src/shared/utils';
import { UserRole } from '@prisma/client';
import { AllConsentRecordsQuerySchema } from '@src/features/consent/validators/consent.validators';
import { logger } from '@src/shared/logger/server';

/**
 * GET /api/consent/all
 *
 * Retrieves all consent records in the association with pagination and filtering.
 * Roles: DPO, SUPER_ADMIN
 */
export const GET = withAssociation(
  { query: AllConsentRecordsQuerySchema },
  async (association, { query, traceId }, req) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'GET /api/consent/all - Request started',
    );

    const user = await withRole(req, UserRole.DPO);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'GET /api/consent/all - User authorized',
    );

    const page = query?.page ?? 1;
    const { records, total } = await ConsentService.getAllConsentRecords(association.id, query);

    logger.info(
      {
        traceId,
        count: records.length,
      },
      'GET /api/consent/all - Success',
    );

    return SuccessResponse({
      data: records,
      meta: buildPagination(total, page),
    });
  },
);
