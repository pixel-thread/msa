import { withAssociation, withRole } from "@src/shared/api";
import { ConsentService } from "@src/features/consent";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";

/**
 * GET /api/consent/report
 *
 * Retrieves the consent report for the association.
 * Roles: DPO, PRESIDENT, SUPER_ADMIN
 */
export const GET = withAssociation({}, async (association, _, req) => {
  await withRole(req, UserRole.DPO);

  const report = await ConsentService.getConsentReport(association.id);

  return SuccessResponse({
    data: report,
  });
});
