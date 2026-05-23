import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { findUserCompletions } from "@feature/training/services";
import { pageNumberValidation } from "@src/shared/validators/common";
import { z } from "zod";

const TrainingCompletionQuerySchema = z.object({
  page: pageNumberValidation,
});
export const GET = withAssociation(
  { query: TrainingCompletionQuerySchema },
  async (association, { query }, request) => {
    const user = await withRole(request, UserRole.MEMBER);
    const page = query?.page;

    const completions = await findUserCompletions({
      userId: user.id,
      associationId: association.id,
      page,
    });

    return SuccessResponse({
      data: completions.module,
      meta: completions.pagination,
    });
  },
);
