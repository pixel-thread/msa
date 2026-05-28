import { withAssociation, withRole } from "@src/shared/api";
import { ConsentService } from "@src/features/consent";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { UnauthorizedError } from "@src/shared/errors";
import { logger } from "@src/shared/logger";

/**
 * GET /api/consent/my
 *
 * Retrieves the current consent state for the authenticated user.
 */
export const GET = withAssociation({}, async (association, { traceId }, req) => {
  logger.info("GET /api/consent/my - Request started", {
    traceId,
    associationId: association.id,
  });

  const user = await withRole(req, UserRole.MEMBER);

  logger.info("GET /api/consent/my - User authorized", {
    traceId,
    userId: user.id,
  });

  const userId = req.headers.get("x-user-id");

  if (!userId) throw new UnauthorizedError("User ID not found");

  const consentState = await ConsentService.getUserConsentState(
    userId,
    association.id,
  );

  logger.info("GET /api/consent/my - Success", { traceId });

  return SuccessResponse({
    data: consentState,
  });
});
