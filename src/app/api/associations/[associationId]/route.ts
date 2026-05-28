import { withValidation, withRole } from "@src/shared/api";
import {
  CreateAssociationInput,
  CreateAssociationSchema,
} from "@validator/associations";
import { findUniqueAssociation } from "@src/features/associations/services/findUniqueAssociation";
import { findFirstAssociation } from "@src/features/associations/services/findFirstAssociation";
import { updateAssociation } from "@src/features/associations/services/updateAssociation";
import { SuccessResponse } from "@src/shared/utils";
import type { Association } from "@prisma/client";
import { ConflictError, NotFoundError } from "@src/shared/errors";
import z from "zod";
import { logger } from "@src/shared/logger";
import { UserRole } from "@prisma/client";

const ParamsSchema = z.object({
  associationId: z.string().uuid(),
});

export const GET = withValidation(
  { params: ParamsSchema },
  async (req, _ctx, { params, traceId }) => {
    logger.info("GET /api/associations/[associationId] - Request started", { traceId, associationId: params?.associationId });
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info("GET /api/associations/[associationId] - User authorized", { traceId, userId: user.id, roles: user.role });

    const association = await findUniqueAssociation({
      where: { id: params?.associationId },
    });

    if (!association) {
      logger.error("GET /api/associations/[associationId] - Association not found", { traceId, associationId: params?.associationId });
      throw new NotFoundError("Association not found");
    }

    logger.info("GET /api/associations/[associationId] - Success", { traceId, associationId: params?.associationId });

    return SuccessResponse<Association>({
      data: association,
      message: "Association found successfully",
    });
  },
);

export const PATCH = withValidation(
  { body: CreateAssociationSchema, params: ParamsSchema },
  async (req, _ctx, { body, params, traceId }) => {
    logger.info("PATCH /api/associations/[associationId] - Request started", { traceId, associationId: params?.associationId });
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info("PATCH /api/associations/[associationId] - User authorized", { traceId, userId: user.id, roles: user.role });

    const existing = await findUniqueAssociation({
      where: { id: params?.associationId },
    });

    if (!existing) {
      logger.error("PATCH /api/associations/[associationId] - Association Not Found", { traceId, associationId: params?.associationId });
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
        logger.error("PATCH /api/associations/[associationId] - Association conflict", { traceId, slug: body?.slug, name: body?.name });
        throw new ConflictError(
          "Association with this slug or name already exists",
        );
      }
    }

    const updated = await updateAssociation({
      where: { id: params?.associationId as string },
      data: body as CreateAssociationInput,
    });

    logger.info("PATCH /api/associations/[associationId] - Success", { traceId, associationId: params?.associationId });

    return SuccessResponse<Association>(
      { data: updated, message: "Association updated successfully" },
      200,
    );
  },
);
