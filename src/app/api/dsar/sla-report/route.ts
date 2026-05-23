import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { getDsarSlaStatus } from "@src/features/dsar/services";

export const GET = withAssociation(
  {},
  async (association, _validated, request) => {
    await withRole(request, UserRole.DPO);

    const report = await getDsarSlaStatus(association.id);

    return SuccessResponse({ data: report, message: "" });
  },
);
