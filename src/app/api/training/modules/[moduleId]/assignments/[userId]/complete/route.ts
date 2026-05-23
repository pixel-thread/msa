import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError, BadRequestError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { completeAssignment } from "@feature/training/services";
import { z } from "zod";

const ParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
  userId: z.uuid("Invalid user ID"),
});

const BodySchema = z.object({
  scorePercent: z.number().min(0).max(100).optional(),
});

export const POST = withAssociation(
  { params: ParamsSchema, body: BodySchema },
  async (association, { params, body }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid parameters");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const { moduleId, userId } = params;
    const actor = await withRole(request, UserRole.SECRETARY);

    try {
      const result = await completeAssignment({
        associationId: association.id,
        moduleId,
        userId,
        actorId: actor.id,
        scorePercent: body.scorePercent,
      });

      return SuccessResponse({ data: result }, 201);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError("Failed to complete assignment");
    }
  },
);
