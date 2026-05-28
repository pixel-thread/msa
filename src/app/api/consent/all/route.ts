import { withAssociation, withRole } from "@src/shared/api";
import { ConsentService } from "@src/features/consent";
import { buildPagination, SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { AllConsentRecordsQuerySchema } from "@src/features/consent/validators/consent.validators";
import { logger } from "@src/shared/logger";

/**
 * GET /api/consent/all
 *
 * Retrieves all consent records in the association with pagination and filtering.
 * Roles: DPO, SUPER_ADMIN
 */
export const GET = withAssociation(
  { query: AllConsentRecordsQuerySchema },
  async (association, { query, traceId }, req) => {
    logger.info("GET /api/consent/all - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(req, UserRole.DPO);

    logger.info("GET /api/consent/all - User authorized", {
      traceId,
      userId: user.id,
    });

    const page = query?.page ?? 1;
    const { records, total } = await ConsentService.getAllConsentRecords(
      association.id,
      query,
    );

    logger.info("GET /api/consent/all - Success", {
      traceId,
      count: records.length,
    });

    return SuccessResponse({
      data: records,
      meta: buildPagination(total, page),
    });
  },
);
