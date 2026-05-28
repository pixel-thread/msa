import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { createModule, findManyModules } from "@feature/training/services";
import { CreateTrainingModuleSchema } from "@feature/training/validators/training";
import { hasHighRoleAccess } from "@src/shared/utils/has-high-role";
import { z } from "zod";
import { pageNumberValidation } from "@src/shared/validators";
import { logger } from "@src/shared/logger";

const TraingModuleQuerySchema = z.object({
  page: pageNumberValidation,
});
export const GET = withAssociation(
  { query: TraingModuleQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info("GET /training/modules - Request started", { traceId, associationId: association.id });

    const user = await withRole(request, UserRole.MEMBER);
    logger.info("GET /training/modules - User authorized", { traceId, userId: user.id, role: user.role });

    const isManager =
      hasHighRoleAccess(user.role) || user.role.includes(UserRole.DPO);
    const isActive = isManager ? undefined : true;
    const role = isManager ? undefined : user.role;

    if (hasHighRoleAccess(user.role)) {
      const modules = await findManyModules({
        associationId: association.id,
        isActive,
        role,
        page: query?.page || 1,
      });
      logger.info("GET /training/modules - Success", { traceId });
      return SuccessResponse({
        data: modules.trainingModules,
        meta: modules.pagination,
      });
    }

    const modules = await findManyModules({
      associationId: association.id,
      userId: user.id,
      isActive,
      role,
      page: query?.page || 1,
    });

    logger.info("GET /training/modules - Success", { traceId });
    return SuccessResponse({
      data: modules.trainingModules,
      meta: modules.pagination,
    });
  },
);

export const POST = withAssociation(
  { body: CreateTrainingModuleSchema },
  async (association, { body, traceId }, request) => {
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    logger.info("POST /training/modules - Request started", { traceId, associationId: association.id });

    const user = await withRole(request, UserRole.DPO); // DPO or higher
    logger.info("POST /training/modules - User authorized", { traceId, userId: user.id });

    const trainingModule = await createModule({
      associationId: association.id,
      actorId: user.id,
      data: body,
    });

    logger.info("POST /training/modules - Success", { traceId, moduleId: trainingModule.id });
    return SuccessResponse({ data: trainingModule }, 201);
  },
);
