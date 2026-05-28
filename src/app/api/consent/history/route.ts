import { withAssociation } from "@src/shared/api";
import { ConsentService } from "@src/features/consent";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";
import { pageNumberValidation } from "@src/shared/validators";
import { UnauthorizedError } from "@src/shared/errors";
import { logger } from "@src/shared/logger";

/**
 * GET /api/consent/history
 *
 * Retrieves the consent history for the authenticated user.
 */
const HistoryQuerySchema = z.object({
  page: pageNumberValidation,
});
export const GET = withAssociation(
  { query: HistoryQuerySchema },
  async (association, { query, traceId }, req) => {
    logger.info("GET /api/consent/history - Request started", {
      traceId,
      associationId: association.id,
    });

    const userId = req.headers.get("x-user-id");

    if (!userId) {
      throw new UnauthorizedError();
    }

    const page = query?.page || 1;
    const data = await ConsentService.getConsentHistory(
      userId,
      association.id,
      page,
    );

    logger.info("GET /api/consent/history - Success", { traceId, userId });

    return SuccessResponse({
      data: data.history,
      meta: data.pagination,
    });
  },
);
