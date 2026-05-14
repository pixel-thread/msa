import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError, NotFoundError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { findUniqueModule, updateModule } from "@feature/training/services";
import { UpdateTrainingModuleSchema } from "@feature/training/validators/training";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";
import { z } from "zod";

const TrainingParamsSchema = z.object({
  moduleId: z.string().uuid("Invalid module ID"),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }
    await withRole(request, UserRole.MEMBER);
    const { moduleId } = params;

    const module = await findUniqueModule({
      associationId: association.id,
      moduleId,
    });

    if (!module) {
      throw new NotFoundError("Training module not found");
    }

    return SuccessResponse({ data: module });
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
    const userId = request.headers.get("x-user-id")!;
    const user = await withRole(request, UserRole.DPO);

    const module = await updateModule({
      associationId: association.id,
      moduleId,
      actorId: userId,
      data: body,
    });

    return SuccessResponse({ data: module });
  },
);
