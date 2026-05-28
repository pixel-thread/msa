import { withAssociation, withRole } from "@src/shared/api";
import { UserRole } from "@prisma/client";
import { generateComplianceEvidence } from "@src/features/compliance/services";
import { SuccessResponse } from "@src/shared/utils";
import { logger } from "@src/shared/logger";

export const GET = withAssociation(
  {},
  async (association, { traceId }, request) => {
    logger.info("GET /api/compliance/evidence - Request started", { traceId, associationId: association.id });
    const user = await withRole(request, UserRole.DPO);
    logger.info("GET /api/compliance/evidence - User authorized", { traceId, userId: user.id, roles: user.role });

    const evidence = await generateComplianceEvidence(association.id, 30);

    logger.info("GET /api/compliance/evidence - Success", { traceId, associationId: association.id });

    return SuccessResponse({
      data: evidence,
    });
  },
);

