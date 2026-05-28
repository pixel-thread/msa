import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { findAssociationAdmins } from "@src/features/dsar/services";
import { logger } from "@src/shared/logger";

export const GET = withAssociation(
  {},
  async (association, { traceId }, request) => {
    logger.info("GET /api/dsar/admins - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(request, UserRole.DPO);

    logger.info("GET /api/dsar/admins - User authorized", {
      traceId,
      userId: user.id,
    });

    const admins = await findAssociationAdmins(association.id);

    logger.info("GET /api/dsar/admins - Success", {
      traceId,
      count: admins.length,
    });

    return SuccessResponse({ data: admins });
  },
);
