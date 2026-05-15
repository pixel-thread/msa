import { withAssociation } from "@src/shared/api/with-association";
import { ConsentService } from "@src/features/consent";
import { SuccessResponse } from "@src/shared/utils";
import { withRole } from "@src/shared/api/with-role";
import { UserRole } from "@prisma/client";

/**
 * GET /api/consent/all
 *
 * Retrieves all consent records in the association.
 * Roles: DPO, SUPER_ADMIN
 */
export const GET = withAssociation({}, async (association, _, req) => {
  await withRole(req, UserRole.DPO);

  const records = await ConsentService.getAllConsentRecords(association.id);

  return SuccessResponse({
    data: records,
  });
});
