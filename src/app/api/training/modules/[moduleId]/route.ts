import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError, NotFoundError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { findUniqueModule, updateModule, deleteModule } from "@feature/training/services";
import { UpdateTrainingModuleSchema } from "@feature/training/validators/training";
import { z } from "zod";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }
    await withRole(request, UserRole.MEMBER);
    const { moduleId } = params;

    const trainingmodule = await findUniqueModule({
      associationId: association.id,
      moduleId,
    });

    if (!trainingmodule) {
      throw new NotFoundError("Training module not found");
    }

    return SuccessResponse({ data: trainingmodule });
  },
);

export const PATCH = withAssociation(
  { params: TrainingParamsSchema, body: UpdateTrainingModuleSchema },
  async (association, { params, body }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);

    const trainingModule = await updateModule({
      associationId: association.id,
      moduleId,
      actorId: user.id,
      data: body,
    });

    return SuccessResponse({ data: trainingModule });
  },
);

export const DELETE = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);

    await deleteModule({
      associationId: association.id,
      moduleId,
      actorId: user.id,
    });

    return SuccessResponse({ data: { success: true } });
  },
);
