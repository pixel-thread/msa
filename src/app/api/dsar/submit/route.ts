import { withAssociation } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { submitDsarTicket } from '@src/features/dsar/services';
import { SubmitDsarSchema } from '@src/features/dsar/validators';
import { logger } from '@src/shared/logger/server';

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
  async (association, { body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'POST /api/dsar/submit - Request started',
    );

    const userId = request.headers.get('x-user-id')!;

    const ticket = await submitDsarTicket({
      associationId: association.id,
      userId,
      data: body!,
    });

    logger.info(
      {
        traceId,
        userId,
        ticketId: ticket.id,
      },
      'POST /api/dsar/submit - Success',
    );

    return SuccessResponse({ data: ticket }, 201);
  },
);
