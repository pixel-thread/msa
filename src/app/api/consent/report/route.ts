import { withAssociation, withRole } from "@src/shared/api";
import { ConsentService } from "@src/features/consent";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { logger } from "@src/shared/logger";

/**
 * GET /api/consent/report
 *
 * Retrieves the consent report for the association.
 * Roles: DPO, PRESIDENT, SUPER_ADMIN
 */
export const GET = withAssociation({}, async (association, { traceId }, req) => {
  logger.info("GET /api/consent/report - Request started", {
    traceId,
    associationId: association.id,
  });

  const user = await withRole(req, UserRole.DPO);

  logger.info("GET /api/consent/report - User authorized", {
    traceId,
    userId: user.id,
  });

  const report = await ConsentService.getConsentReport(association.id);

  logger.info("GET /api/consent/report - Success", { traceId });

  return SuccessResponse({
    data: report,
  });
});
