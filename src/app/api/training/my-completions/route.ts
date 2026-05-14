import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { findUserCompletions } from "@feature/training/services";

export const GET = withAssociation(
  {},
  async (association, _, request) => {
    const user = await withRole(request, UserRole.MEMBER);

    const completions = await findUserCompletions({
      userId: user.id,
      associationId: association.id,
    });

    return SuccessResponse({ data: completions });
  },
);
