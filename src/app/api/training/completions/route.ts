import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { findManyCompletions } from "@feature/training/services";

export const GET = withAssociation(
  {},
  async (association, _, request) => {
    await withRole(request, UserRole.SECRETARY); // Secretary, DPO, Super Admin
    
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId") || undefined;
    const userId = searchParams.get("userId") || undefined;

    const completions = await findManyCompletions({
      associationId: association.id,
      moduleId,
      userId,
    });

    return SuccessResponse({ data: completions });
  },
);
