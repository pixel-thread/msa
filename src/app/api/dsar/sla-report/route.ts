import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { getDsarSlaStatus } from "@src/features/dsar/services";
import { logger } from "@src/shared/logger";

export const GET = withAssociation(
  {},
  async (association, { traceId }, request) => {
    logger.info("GET /api/dsar/sla-report - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(request, UserRole.DPO);

    logger.info("GET /api/dsar/sla-report - User authorized", {
      traceId,
      userId: user.id,
    });

    const report = await getDsarSlaStatus(association.id);

    logger.info("GET /api/dsar/sla-report - Success", { traceId });

    return SuccessResponse({ data: report, message: "" });
  },
);
