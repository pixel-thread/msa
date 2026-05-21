import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError, BadRequestError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { findManySupplements, createSupplement } from "@feature/training/services";
import { CreateSupplementSchema } from "@feature/training/validators/training";
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

    const supplements = await findManySupplements({
      associationId: association.id,
      moduleId,
    });

    return SuccessResponse({ data: supplements });
  },
);

export const POST = withAssociation(
  { params: TrainingParamsSchema, body: CreateSupplementSchema },
  async (association, { params, body }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);

    try {
      const supplement = await createSupplement({
        associationId: association.id,
        moduleId,
        actorId: user.id,
        data: body,
      });

      return SuccessResponse({ data: supplement }, 201);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError("Failed to create supplement");
    }
  },
);
