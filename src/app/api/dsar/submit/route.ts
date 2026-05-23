import { withAssociation } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { submitDsarTicket } from "@src/features/dsar/services";
import { SubmitDsarSchema } from "@src/features/dsar/validators";

/**
 * @api {post} /api/dsar/submit Submit DSAR Request
 * @apiName SubmitDsar
 * @apiGroup DSAR
 * @apiDescription Allows a member to file a new Data Subject Access Request.
 * The request is automatically scoped to the member's association.
 * 
 * @apiBody {String} requestType Enum: ACCESS, CORRECTION, DELETION, PORTABILITY
 * @apiBody {String[]} requestedData List of data categories (e.g., PROFILE_DATA, PAYMENT_HISTORY)
 * @apiBody {String} [description] Optional context for the request
 * 
 * @apiSuccess (201) {Object} data The created DsarTicket object.
 * @apiPermission MEMBER
 */
export const POST = withAssociation(
  { body: SubmitDsarSchema },
  async (association, { body }, request) => {
    const userId = request.headers.get("x-user-id")!;

    const ticket = await submitDsarTicket({
      associationId: association.id,
      userId,
      data: body!,
    });

    return SuccessResponse({ data: ticket }, 201);
  }
);
