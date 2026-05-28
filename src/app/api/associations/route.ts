import { withValidation, withRole, withAssociation } from "@src/shared/api";
import { createAssociation } from "@src/features/associations/services/createAssociation";
import { findFirstAssociation } from "@src/features/associations/services/findFirstAssociation";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole, type Association } from "@prisma/client";
import { ConflictError } from "@src/shared/errors";
import type { CreateAssociationInput } from "@validator/associations";
import { CreateAssociationSchema } from "@src/shared/validators";
import { logger } from "@src/shared/logger";

export const GET = withAssociation({}, async (association, { traceId }, req) => {
  logger.info("GET /api/associations - Request started", { traceId });
  const user = await withRole(req, UserRole.MEMBER);
  logger.info("GET /api/associations - User authorized", { traceId, userId: user.id, roles: user.role });

  logger.info("GET /api/associations - Success", { traceId, associationId: association.id });

  return SuccessResponse({
    data: association,
  });
});

export const POST = withValidation(
  { body: CreateAssociationSchema },
  async (req, _ctx, { body, traceId }) => {
    logger.info("POST /api/associations - Request started", { traceId, name: body?.name });
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info("POST /api/associations - User authorized", { traceId, userId: user.id, roles: user.role });

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
      logger.error("POST /api/associations - Association Already Exists", { traceId, slug: body?.slug, name: body?.name });
      throw new ConflictError("Association Already Exists");
    }

    const association = await createAssociation({
      data: body as CreateAssociationInput,
    });

    logger.info("POST /api/associations - Success", { traceId, associationId: association.id });

    return SuccessResponse<Association>(
      {
        data: association,
        message: "Association created successfully",
      },
      201,
    );
  },
);
