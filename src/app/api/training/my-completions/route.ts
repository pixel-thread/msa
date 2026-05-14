import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { findUserCompletions } from "@feature/training/services";

export const GET = withAssociation(
  {},
  async (_association, _, request) => {
    await withRole(request, UserRole.MEMBER);
    const userId = request.headers.get("x-user-id")!;

    const completions = await findUserCompletions({ userId });

    return SuccessResponse({ data: completions });
  },
);
