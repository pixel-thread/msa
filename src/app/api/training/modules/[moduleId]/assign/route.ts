import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
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
import { z } from "zod";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
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
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    await withRole(request, UserRole.MEMBER);
    const { moduleId } = params;

    const assignments = await getTrainingAssignments({
      associationId: association.id,
      moduleId,
    });

    return SuccessResponse({ data: assignments });
  },
);

export const POST = withAssociation(
  { params: TrainingParamsSchema, body: AssignTrainingSchema },
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
      const assignment = await assignTraining({
        associationId: association.id,
        moduleId,
        userId: body.userId,
        assignedById: user.id,
      });

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
      const result = await bulkAssignTraining({
        associationId: association.id,
        moduleId,
        userIds: body.userIds,
        assignedById: user.id,
      });

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
      const result = await removeTrainingAssignment({
        associationId: association.id,
        moduleId,
        userId: body.userId,
        removedById: user.id,
      });

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
      const result = await bulkRemoveTrainingAssignment({
        associationId: association.id,
        moduleId,
        userIds: body.userIds,
        removedById: user.id,
      });

      return SuccessResponse({ data: result });
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError("Failed to bulk remove training assignments");
    }
  },
);

