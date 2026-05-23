import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { findUserAssignments } from "@feature/training/services";
import { pageNumberValidation } from "@src/shared/validators/common";
import { z } from "zod";

const TrainingAssignmentQuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: TrainingAssignmentQuerySchema },
  async (association, { query }, request) => {
    const user = await withRole(request, UserRole.MEMBER);
    const page = query?.page;

    const assignments = await findUserAssignments({
      userId: user.id,
      associationId: association.id,
      page,
    });

    return SuccessResponse({
      data: assignments.assignments,
      meta: assignments.pagination,
    });
  },
);
