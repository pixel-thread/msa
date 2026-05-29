import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { UserRole } from '@prisma/client';
import { respondToDsarTicket } from '@src/features/dsar/services';
import { RespondDsarSchema } from '@src/features/dsar/validators';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const ParamsSchema = z.object({ ticketId: z.uuid() });

/**
 * @api {post} /api/dsar/:ticketId/respond Respond to DSAR
 * @apiName RespondDsar
 * @apiGroup DSAR
 * @apiDescription Allows a DPO or Admin to process and respond to a DSAR ticket.
 * This can be used to update status, reject with reason, or provide secure download keys.
 *
 * @apiParam {String} ticketId Unique UUID of the DSAR ticket.
 *
 * @apiBody {String} status Enum: IN_PROGRESS, COMPLETED, REJECTED
 * @apiBody {String} [notes] Internal notes or member-facing message.
 * @apiBody {String} [rejectedReason] Required if status is REJECTED.
 * @apiBody {String} [responseType] Format of the data being provided (e.g., JSON, PDF).
 * @apiBody {String} [storageKey] Key for the encrypted data in secure storage.
 *
 * @apiSuccess {Object} data The updated DsarTicket object.
 * @apiPermission DPO
 */
export const POST = withAssociation(
  { params: ParamsSchema, body: RespondDsarSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
        ticketId: params?.ticketId,
      },
      'POST /api/dsar/[ticketId]/respond - Request started',
    );

    const actorId = request.headers.get('x-user-id')!;
    const actor = await withRole(request, UserRole.DPO);

    logger.info(
      {
        traceId,
        userId: actor.id,
      },
      'POST /api/dsar/[ticketId]/respond - User authorized',
    );

    const ticket = await respondToDsarTicket({
      associationId: association.id,
      ticketId: params!.ticketId,
      actorId,
      data: body!,
    });

    logger.info({ traceId }, 'POST /api/dsar/[ticketId]/respond - Success');

    return SuccessResponse({ data: ticket });
  },
);
