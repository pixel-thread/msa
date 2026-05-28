import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { buildPagination } from "@src/shared/utils";
import { ForbiddenError, BadRequestError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  assignTraining,
  bulkAssignTraining,
  removeTrainingAssignment,
  bulkRemoveTrainingAssignment,
  getTrainingAssignments,
} from "@feature/training/services";
import {
  AssignTrainingSchema,
  BulkAssignTrainingSchema,
} from "@feature/training/validators/training";
import { pageNumberValidation } from "@src/shared/validators";
import { z } from "zod";
import { logger } from "@src/shared/logger";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
});

const TrainingQuerySchema = z.object({
  page: pageNumberValidation,
});

const RemoveAssignSchema = z.object({
  userId: z.uuid("Invalid user ID"),
});

const BulkRemoveAssignSchema = z.object({
  userIds: z
    .array(z.uuid("Invalid user ID"))
    .min(1, "At least one user is required"),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema, query: TrainingQuerySchema },
  async (association, { params, query, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    logger.info("GET /training/modules/{moduleId}/assign - Request started", { traceId, associationId: association.id });

    await withRole(request, UserRole.SECRETARY);
    logger.info("GET /training/modules/{moduleId}/assign - User authorized", { traceId });

    const { moduleId } = params;
    const page = query?.page || 1;

    const result = await getTrainingAssignments({
      associationId: association.id,
      moduleId,
      page,
    });

    logger.info("GET /training/modules/{moduleId}/assign - Success", { traceId });
    return SuccessResponse({
      data: result.data,
      meta: buildPagination(result.total, page),
    });
  },
);

export const POST = withAssociation(
  { params: TrainingParamsSchema, body: AssignTrainingSchema },
  async (association, { params, body, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    logger.info("POST /training/modules/{moduleId}/assign - Request started", { traceId, associationId: association.id });

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);
    logger.info("POST /training/modules/{moduleId}/assign - User authorized", { traceId, userId: user.id });

    try {
      const assignment = await assignTraining({
        associationId: association.id,
        moduleId,
        userId: body.userId,
        assignedById: user.id,
      });

      logger.info("POST /training/modules/{moduleId}/assign - Success", { traceId, userId: body.userId });
      return SuccessResponse({ data: assignment }, 201);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError("Failed to assign training");
    }
  },
);

export const PUT = withAssociation(
  { params: TrainingParamsSchema, body: BulkAssignTrainingSchema },
  async (association, { params, body, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    logger.info("PUT /training/modules/{moduleId}/assign - Request started", { traceId, associationId: association.id });

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);
    logger.info("PUT /training/modules/{moduleId}/assign - User authorized", { traceId, userId: user.id });

    try {
      const result = await bulkAssignTraining({
        associationId: association.id,
        moduleId,
        userIds: body.userIds,
        assignedById: user.id,
      });

      logger.info("PUT /training/modules/{moduleId}/assign - Success", { traceId, userCount: body.userIds.length });
      return SuccessResponse({ data: result }, 201);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError("Failed to bulk assign training");
    }
  },
);

export const DELETE = withAssociation(
  { params: TrainingParamsSchema, body: RemoveAssignSchema },
  async (association, { params, body, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    logger.info("DELETE /training/modules/{moduleId}/assign - Request started", { traceId, associationId: association.id });

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);
    logger.info("DELETE /training/modules/{moduleId}/assign - User authorized", { traceId, userId: user.id });

    try {
      const result = await removeTrainingAssignment({
        associationId: association.id,
        moduleId,
        userId: body.userId,
        removedById: user.id,
      });

      logger.info("DELETE /training/modules/{moduleId}/assign - Success", { traceId, userId: body.userId });
      return SuccessResponse({ data: result });
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError("Failed to remove training assignment");
    }
  },
);

export const PATCH = withAssociation(
  { params: TrainingParamsSchema, body: BulkRemoveAssignSchema },
  async (association, { params, body, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    logger.info("PATCH /training/modules/{moduleId}/assign - Request started", { traceId, associationId: association.id });

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);
    logger.info("PATCH /training/modules/{moduleId}/assign - User authorized", { traceId, userId: user.id });

    try {
      const result = await bulkRemoveTrainingAssignment({
        associationId: association.id,
        moduleId,
        userIds: body.userIds,
        removedById: user.id,
      });

      logger.info("PATCH /training/modules/{moduleId}/assign - Success", { traceId, userCount: body.userIds.length });
      return SuccessResponse({ data: result });
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError("Failed to bulk remove training assignments");
    }
  },
);
