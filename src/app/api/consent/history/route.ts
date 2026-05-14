import { withAssociation } from "@src/shared/api/with-association";
import { requireAuth } from "@src/shared/api/auth";
import { ConsentService } from "@src/features/consent";
import { SuccessResponse } from "@src/shared/utils";

/**
 * GET /api/consent/history
 *
 * Retrieves the consent history for the authenticated user.
 */
export const GET = withAssociation({}, async (association) => {
  const auth = await requireAuth();

  const history = await ConsentService.getConsentHistory(
    auth.userId,
    association.id,
  );

  return SuccessResponse({
    data: history,
  });
});
