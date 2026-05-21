import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError, NotFoundError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findManySupplements,
  updateSupplement,
  deleteSupplement,
} from "@feature/training/services";
import { UpdateSupplementSchema } from "@feature/training/validators/training";
import { z } from "zod";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
  supplementId: z.uuid("Invalid supplement ID"),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid params");
    }
    await withRole(request, UserRole.MEMBER);
    const { moduleId, supplementId } = params;

    const supplements = await findManySupplements({
      associationId: association.id,
      moduleId,
    });

    const supplement = supplements.find((s) => s.id === supplementId);

    if (!supplement) {
      throw new NotFoundError("Training supplement not found");
    }

    return SuccessResponse({ data: supplement });
  },
);

export const PATCH = withAssociation(
  { params: TrainingParamsSchema, body: UpdateSupplementSchema },
  async (association, { params, body }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid params");
    }

    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const { moduleId, supplementId } = params;
    const user = await withRole(request, UserRole.DPO);

    const supplement = await updateSupplement({
      associationId: association.id,
      moduleId,
      supplementId,
      actorId: user.id,
      data: body,
    });

    return SuccessResponse({ data: supplement });
  },
);

export const DELETE = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid params");
    }
    const { moduleId, supplementId } = params;
    const user = await withRole(request, UserRole.DPO);

    const result = await deleteSupplement({
      associationId: association.id,
      moduleId,
      supplementId,
      actorId: user.id,
    });

    return SuccessResponse({ data: result });
  },
);
