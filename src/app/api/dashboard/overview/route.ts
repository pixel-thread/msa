import { withAssociation } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { getDashboardOverview } from "@feature/dashboard/services/dashboard.service";
import { logger } from "@src/shared/logger";

export const GET = withAssociation({}, async (association, { traceId }) => {
  logger.info("GET /api/dashboard/overview - Request started", {
    traceId,
    associationId: association.id,
  });

  const data = await getDashboardOverview(association.id);

  logger.info("GET /api/dashboard/overview - Success", { traceId });

  return SuccessResponse({ data });
});
