import { withAssociation } from "@src/shared/api";
import { ConsentService } from "@src/features/consent";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";
import { pageNumberValidation } from "@src/shared/validators";
import { UnauthorizedError } from "@src/shared/errors";

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
  async (association, { query }, req) => {
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

    return SuccessResponse({
      data: data.history,
      meta: data.pagination,
    });
  },
);
