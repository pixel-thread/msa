import { withAssociation, withRole } from '@src/shared/api';
import { hasHighRoleAccess, SuccessResponse } from '@src/shared/utils';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { assignDsarTicket } from '@src/features/dsar/services/assignDsarTicket';
import { getUniqueUser } from '@src/shared/services';
import { BadRequestError, NotFoundError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';

const ParamsSchema = z.object({
  ticketId: z.uuid(),
});

const AssignSchema = z.object({
  assignedToId: z.uuid(),
});

/**
 * @api {patch} /api/dsar/:ticketId/assign Assign DSAR Ticket
 * @apiName AssignDsar
 * @apiGroup DSAR
 * @apiDescription Assigns a DSAR ticket to a specific administrator for processing.
 *
 * @apiParam {String} ticketId Unique UUID of the DSAR ticket.
 * @apiBody {String} assignedToId UUID of the administrator being assigned.
 *
 * @apiSuccess {Object} data The updated DsarTicket object.
 * @apiPermission DPO
 */
export const PATCH = withAssociation(
  { params: ParamsSchema, body: AssignSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
        ticketId: params?.ticketId,
      },
      'PATCH /api/dsar/[ticketId]/assign - Request started',
    );

    const actorId = request.headers.get('x-user-id')!;

    const actor = await withRole(request, UserRole.DPO);

    logger.info(
      {
        traceId,
        userId: actor.id,
      },
      'PATCH /api/dsar/[ticketId]/assign - User authorized',
    );

    const user = await getUniqueUser({ where: { id: body?.assignedToId } });

    if (!user) throw new NotFoundError('User not found');

    if (!hasHighRoleAccess(user?.role)) {
      throw new BadRequestError('User does have the required role');
    }

    const ticket = await assignDsarTicket({
      associationId: association.id,
      ticketId: params!.ticketId,
      actorId,
      assignedToId: body!.assignedToId,
    });

    logger.info({ traceId }, 'PATCH /api/dsar/[ticketId]/assign - Success');

    return SuccessResponse({ data: ticket });
  },
);
