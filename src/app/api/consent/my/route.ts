import { withAssociation } from "@src/shared/api/with-association";
import { requireAuth } from "@src/shared/api/auth";
import { ConsentService } from "@src/features/consent";
import { SuccessResponse } from "@src/shared/utils";

/**
 * GET /api/consent/my
 *
 * Retrieves the current consent state for the authenticated user.
 */
export const GET = withAssociation({}, async (association) => {
  const auth = await requireAuth();

  const consentState = await ConsentService.getUserConsentState(
    auth.userId,
    association.id,
  );

  return SuccessResponse({
    data: {
      consentState,
      association: association.slug,
    },
  });
});
