import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findUniqueDsarTicket, deleteDsarTicket } from '@src/features/dsar/services';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const ParamsSchema = z.object({
  ticketId: z.uuid(),
});

/**
 * @api {get} /api/dsar/:ticketId Get DSAR Details
 * @apiName GetDsarDetails
 * @apiGroup DSAR
 * @apiDescription Retrieves full details for a specific DSAR ticket, including responses.
 *
 * Access Rules:
 * - Members can view their own tickets.
 * - DPOs and higher roles can view any ticket within their association.
 *
 * @apiParam {String} ticketId Unique UUID of the DSAR ticket.
 *
 * @apiSuccess {Object} data The DsarTicket object with member, assignedTo, and responses relations.
 * @apiPermission OWNER or DPO
 */
export const GET = withAssociation(
  { params: ParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
        ticketId: params?.ticketId,
      },
      'GET /api/dsar/[ticketId] - Request started',
    );

    const userId = request.headers.get('x-user-id')!;
    const ticketId = params!.ticketId;

    const ticket = await findUniqueDsarTicket(ticketId, association.id);

    if (!ticket) {
      throw new NotFoundError('DSAR ticket not found');
    }

    const isOwner = ticket.userId === userId;

    if (!isOwner) {
      // If not owner, check if user has DPO role or higher
      const user = await withRole(request, UserRole.DPO);
      logger.info(
        {
          traceId,
          userId: user.id,
        },
        'GET /api/dsar/[ticketId] - User authorized (DPO)',
      );
    } else {
      logger.info(
        {
          traceId,
          userId,
        },
        'GET /api/dsar/[ticketId] - User authorized (Owner)',
      );
    }

    logger.info({ traceId }, 'GET /api/dsar/[ticketId] - Success');

    return SuccessResponse({ data: ticket });
  },
);

export const DELETE = withAssociation(
  { params: ParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
        ticketId: params?.ticketId,
      },
      'DELETE /api/dsar/[ticketId] - Request started',
    );

    const actorId = request.headers.get('x-user-id')!;
    const user = await withRole(request, UserRole.DPO);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'DELETE /api/dsar/[ticketId] - User authorized',
    );

    const ticket = await findUniqueDsarTicket(params!.ticketId, association.id);
    if (!ticket) {
      throw new NotFoundError('DSAR ticket not found');
    }

    await deleteDsarTicket({
      associationId: association.id,
      ticketId: params!.ticketId,
      actorId,
    });

    logger.info({ traceId }, 'DELETE /api/dsar/[ticketId] - Success');

    return SuccessResponse({
      data: null,
      message: 'DSAR ticket deleted successfully',
    });
  },
);
