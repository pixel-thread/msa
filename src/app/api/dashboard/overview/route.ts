import { withAssociation } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { getDashboardOverview } from "@feature/dashboard/services/dashboard.service";

export const GET = withAssociation({}, async (association) => {
  const data = await getDashboardOverview(association.id);
  return SuccessResponse({ data });
});
