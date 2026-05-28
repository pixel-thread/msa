import { UserRole } from "@prisma/client";
import { findUniqueAssociation } from "@src/features/associations/services/findUniqueAssociation";
import { updateAssociation } from "@src/features/associations/services/updateAssociation";
import { withValidation, withRole } from "@src/shared/api";
import { UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";
import { logger } from "@src/shared/logger";

const ParamsSchema = z.object({
  associationId: z.string().uuid(),
});

export const POST = withValidation(
  { params: ParamsSchema },
  async (req, _ctx, { params, traceId }) => {
    logger.info("POST /api/associations/[associationId]/deactivate - Request started", { traceId, associationId: params?.associationId });
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info("POST /api/associations/[associationId]/deactivate - User authorized", { traceId, userId: user.id, roles: user.role });

    const userId = req.headers.get("x-user-id");

    if (!userId) {
      logger.error("POST /api/associations/[associationId]/deactivate - Unauthorized (missing x-user-id header)", { traceId });
      throw new UnauthorizedError("Unauthorized");
    }

    const associationId = params?.associationId;
    if (!associationId) {
      logger.error("POST /api/associations/[associationId]/deactivate - Association ID is required", { traceId });
      throw new UnauthorizedError("Association ID is required");
    }

    const isAssociationExist = await findUniqueAssociation({
      where: { id: associationId },
    });

    if (!isAssociationExist) {
      logger.error("POST /api/associations/[associationId]/deactivate - Association not found", { traceId, associationId });
      throw new Error("Association not found");
    }

    const updatedAssociation = await updateAssociation({
      where: { id: associationId },
      data: { isActive: false },
    });

    logger.info("POST /api/associations/[associationId]/deactivate - Success", { traceId, associationId });

    return SuccessResponse({
      data: updatedAssociation,
      message: "Association deactivated successfully",
    });
  },
);
