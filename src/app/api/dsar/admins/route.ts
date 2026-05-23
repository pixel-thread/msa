import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { findAssociationAdmins } from "@src/features/dsar/services";

export const GET = withAssociation(
  {},
  async (association, _validated, request) => {
    await withRole(request, UserRole.DPO);

    const admins = await findAssociationAdmins(association.id);

    return SuccessResponse({ data: admins });
  },
);
