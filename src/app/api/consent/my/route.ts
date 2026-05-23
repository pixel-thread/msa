import { withAssociation, withRole } from "@src/shared/api";
import { ConsentService } from "@src/features/consent";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { UnauthorizedError } from "@src/shared/errors";

/**
 * GET /api/consent/my
 *
 * Retrieves the current consent state for the authenticated user.
 */
export const GET = withAssociation({}, async (association, _, req) => {
  await withRole(req, UserRole.MEMBER);

  const userId = req.headers.get("x-user-id");

  if (!userId) throw new UnauthorizedError("User ID not found");

  const consentState = await ConsentService.getUserConsentState(
    userId,
    association.id,
  );

  return SuccessResponse({
    data: consentState,
  });
});
