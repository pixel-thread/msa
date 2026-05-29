import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { UserRole, DsarStatus } from '@prisma/client';
import { respondToDsarTicket } from '@src/features/dsar/services/respondToDsarTicket';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const ParamsSchema = z.object({
  ticketId: z.uuid(),
});

const RejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

/**
 * @api {post} /api/dsar/:ticketId/reject Reject DSAR Request
 * @apiName RejectDsar
 * @apiGroup DSAR
 * @apiDescription Officially rejects a DSAR request with a valid reason.
 * This terminates the ticket lifecycle and sets the terminal REJECTED status.
 *
 * @apiParam {String} ticketId Unique UUID of the DSAR ticket.
 * @apiBody {String} reason Justification for the rejection (max 500 chars).
 *
 * @apiSuccess {Object} data The updated DsarTicket object.
 * @apiPermission DPO
 */
export const POST = withAssociation(
  { params: ParamsSchema, body: RejectSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
        ticketId: params?.ticketId,
      },
      'POST /api/dsar/[ticketId]/reject - Request started',
    );

    const actorId = request.headers.get('x-user-id')!;
    const user = await withRole(request, UserRole.DPO);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'POST /api/dsar/[ticketId]/reject - User authorized',
    );

    const ticket = await respondToDsarTicket({
      associationId: association.id,
      ticketId: params!.ticketId,
      actorId,
      data: {
        status: DsarStatus.REJECTED,
        rejectedReason: body!.reason,
      },
    });

    logger.info({ traceId }, 'POST /api/dsar/[ticketId]/reject - Success');

    return SuccessResponse({ data: ticket });
  },
);
