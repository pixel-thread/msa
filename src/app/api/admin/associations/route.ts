import { withValidation, withRole } from "@src/shared/api";
import { createAssociation } from "@src/features/associations/services/createAssociation";
import { findManyAssociation } from "@src/features/associations/services/findManyAssociation";
import { findFirstAssociation } from "@src/features/associations/services/findFirstAssociation";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import type { Association } from "@prisma/client";
import { ConflictError } from "@src/shared/errors";
import type { CreateAssociationInput } from "@validator/associations";
import { CreateAssociationSchema } from "@src/shared/validators";
import { logger } from "@src/shared/logger";

export const GET = withValidation({}, async (req, _ctx, { traceId }) => {
  logger.info("GET /api/admin/associations - Request started", { traceId });
  const user = await withRole(req, UserRole.SUPER_ADMIN);
  logger.info("GET /api/admin/associations - User authorized", { traceId, userId: user.id, roles: user.role });

  const data = await findManyAssociation({
    orderBy: { createdAt: "desc" },
    where: { status: "ACTIVE" },
  });

  logger.info("GET /api/admin/associations - Success", { traceId, count: data.associations.length });

  return SuccessResponse<Association[]>({
    data: data.associations,
    meta: data.pagination,
  });
});

export const POST = withValidation(
  { body: CreateAssociationSchema },
  async (req, _ctx, { body, traceId }) => {
    logger.info("POST /api/admin/associations - Request started", { traceId, name: body?.name });
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info("POST /api/admin/associations - User authorized", { traceId, userId: user.id, roles: user.role });

    const existing = await findFirstAssociation({
      where: {
        OR: [
          { slug: body?.slug, status: "ACTIVE" },
          { name: body?.name, status: "ACTIVE" },
        ],
      },
      take: 1,
    });

    if (existing) {
      logger.error("POST /api/admin/associations - Association Already Exists", { traceId, slug: body?.slug, name: body?.name });
      throw new ConflictError("Association Already Exists");
    }

    const association = await createAssociation({
      data: body as CreateAssociationInput,
    });

    logger.info("POST /api/admin/associations - Success", { traceId, associationId: association.id });

    return SuccessResponse<Association>(
      {
        data: association,
        message: "Association created successfully",
      },
      201,
    );
  },
);
