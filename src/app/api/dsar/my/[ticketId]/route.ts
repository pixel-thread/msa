import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { findUniqueDsarTicket } from '@src/features/dsar/services/findUniqueDsarTicket';
import { ForbiddenError, NotFoundError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info(
    {
      traceId,
      associationId: association.id,
    },
    'GET /api/dsar/my/[ticketId] - Request started',
  );

  const user = await withRole(request, UserRole.MEMBER);
  const userId = request.headers.get('x-user-id')!;

  logger.info(
    {
      traceId,
      userId: user.id,
    },
    'GET /api/dsar/my/[ticketId] - User authorized',
  );

  const { ticketId } = (await params) as { ticketId: string };

  const ticket = await findUniqueDsarTicket(ticketId, association.id);

  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  if (ticket.userId !== userId) {
    throw new ForbiddenError('Not authorized to view this ticket');
  }

  logger.info({ traceId, ticketId }, 'GET /api/dsar/my/[ticketId] - Success');

  return SuccessResponse({ data: ticket });
});
