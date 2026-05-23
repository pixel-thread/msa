import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findManyCompletions,
  recordCompletion,
} from "@feature/training/services";
import { RecordCompletionSchema } from "@feature/training/validators/training";
import { z } from "zod";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
});
export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, req) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    const { moduleId } = params;
    await withRole(req, UserRole.MEMBER);

    const data = await findManyCompletions({
      associationId: association.id,
      moduleId,
    });

    return SuccessResponse({ data: data.completions, meta: data.pagination });
  },
);

export const POST = withAssociation(
  { params: TrainingParamsSchema, body: RecordCompletionSchema },
  async (association, { params, body }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const { moduleId } = params;

    const user = await withRole(request, UserRole.SUPER_ADMIN);

    const completion = await recordCompletion({
      associationId: association.id,
      userId: user.id,
      moduleId,
      data: body,
    });

    return SuccessResponse({ data: completion }, 201);
  },
);
