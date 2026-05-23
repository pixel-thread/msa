import { withAssociation, requireAuth } from "@src/shared/api";
import { ConsentService, ConsentUpdateSchema } from "@src/features/consent";
import { ConsentStatus } from "@prisma/client";
import { SuccessResponse } from "@src/shared/utils";
import { BadRequestError } from "@src/shared/errors";

/**
 * POST /api/consent/grant
 *
 * Grants consent for specific purposes.
 */
export const POST = withAssociation(
  {
    body: ConsentUpdateSchema.omit({ action: true }),
  },
  async (association, { body }, request) => {
    const auth = await requireAuth();

    if (!body) {
      throw new BadRequestError("Request body is required");
    }

    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    const receipts = await ConsentService.updateConsent(
      auth.userId,
      association.id,
      {
        ...body,
        action: ConsentStatus.GRANTED,
      },
      ipAddress,
      userAgent,
    );

    return SuccessResponse({
      message: "Consent granted successfully",
      data: receipts,
    });
  },
);
