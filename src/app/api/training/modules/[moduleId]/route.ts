import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError, NotFoundError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { findUniqueModule, updateModule, deleteModule } from "@feature/training/services";
import { UpdateTrainingModuleSchema } from "@feature/training/validators/training";
import { z } from "zod";
import { logger } from "@src/shared/logger";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    logger.info("GET /training/modules/{moduleId} - Request started", { traceId, associationId: association.id });

    await withRole(request, UserRole.MEMBER);
    logger.info("GET /training/modules/{moduleId} - User authorized", { traceId });

    const { moduleId } = params;

    const trainingmodule = await findUniqueModule({
      associationId: association.id,
      moduleId,
    });

    if (!trainingmodule) {
      throw new NotFoundError("Training module not found");
    }

    logger.info("GET /training/modules/{moduleId} - Success", { traceId, moduleId });
    return SuccessResponse({ data: trainingmodule });
  },
);

export const PATCH = withAssociation(
  { params: TrainingParamsSchema, body: UpdateTrainingModuleSchema },
  async (association, { params, body, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    logger.info("PATCH /training/modules/{moduleId} - Request started", { traceId, associationId: association.id });

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);
    logger.info("PATCH /training/modules/{moduleId} - User authorized", { traceId, userId: user.id });

    const trainingModule = await updateModule({
      associationId: association.id,
      moduleId,
      actorId: user.id,
      data: body,
    });

    logger.info("PATCH /training/modules/{moduleId} - Success", { traceId, moduleId });
    return SuccessResponse({ data: trainingModule });
  },
);

export const DELETE = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    logger.info("DELETE /training/modules/{moduleId} - Request started", { traceId, associationId: association.id });

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);
    logger.info("DELETE /training/modules/{moduleId} - User authorized", { traceId, userId: user.id });

    await deleteModule({
      associationId: association.id,
      moduleId,
      actorId: user.id,
    });

    logger.info("DELETE /training/modules/{moduleId} - Success", { traceId, moduleId });
    return SuccessResponse({ data: { success: true } });
  },
);
