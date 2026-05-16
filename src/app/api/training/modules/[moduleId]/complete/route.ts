import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { recordCompletion } from "@feature/training/services";
import { RecordCompletionSchema } from "@feature/training/validators/training";
import { z } from "zod";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
});

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

    const user = await withRole(request, UserRole.MEMBER);

    const completion = await recordCompletion({
      associationId: association.id,
      userId: user.id,
      moduleId,
      data: body,
    });

    return SuccessResponse({ data: completion }, 201);
  },
);
