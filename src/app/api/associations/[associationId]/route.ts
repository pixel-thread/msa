import { withValidation } from "@src/shared/api";
import {
  CreateAssociationInput,
  CreateAssociationSchema,
} from "@src/shared/lib/validations";
import { findUniqueAssociation } from "@src/features/associations/services/findUniqueAssociation";
import { findFirstAssociation } from "@src/features/associations/services/findFirstAssociation";
import { updateAssociation } from "@src/features/associations/services/updateAssociation";
import { SuccessResponse } from "@src/shared/utils";
import type { Association } from "@prisma/client";
import { ConflictError, NotFoundError } from "@src/shared/errors";
import z from "zod";

const ParamsSchema = z.object({
  associationId: z.string().uuid(),
});

export const GET = withValidation(
  { params: ParamsSchema },
  async (_req, _ctx, { params }) => {
    const association = await findUniqueAssociation({
      where: { id: params?.associationId },
    });

    if (!association) throw new NotFoundError("Association not found");

    return SuccessResponse<Association>({
      data: association,
      message: "Association found successfully",
    });
  },
);

export const PATCH = withValidation(
  { body: CreateAssociationSchema, params: ParamsSchema },
  async (_req, _ctx, { body, params }) => {
    const existing = await findUniqueAssociation({
      where: { id: params?.associationId },
    });

    if (!existing) {
      throw new NotFoundError("Association Not Found");
    }

    if (body?.slug !== existing.slug || body?.name !== existing.name) {
      const conflict = await findFirstAssociation({
        where: {
          id: { not: params?.associationId },
          OR: [{ slug: body?.slug }, { name: body?.name }],
        },
        take: 1,
      });

      if (conflict) {
        throw new ConflictError(
          "Association with this slug or name already exists",
        );
      }
    }

    const updated = await updateAssociation({
      where: { id: params?.associationId as string },
      data: body as CreateAssociationInput,
    });

    return SuccessResponse<Association>(
      { data: updated, message: "Association updated successfully" },
      200,
    );
  },
);
