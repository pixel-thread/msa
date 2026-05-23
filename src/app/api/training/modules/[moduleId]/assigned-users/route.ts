import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError, BadRequestError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { getAssignedUsers, completeAssignment } from "@feature/training/services";
import { z } from "zod";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
});

const CompleteAssignmentSchema = z.object({
  scorePercent: z.number().min(0).max(100).optional(),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    await withRole(request, UserRole.SECRETARY);
    const { moduleId } = params;

    const assignedUsers = await getAssignedUsers({
      associationId: association.id,
      moduleId,
    });

    return SuccessResponse({ data: assignedUsers });
  },
);
