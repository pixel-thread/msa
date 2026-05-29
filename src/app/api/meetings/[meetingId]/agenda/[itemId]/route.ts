import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { updateAgendaItem } from '@src/features/meetings/services/updateAgendaItem';
import { deleteAgendaItem } from '@src/features/meetings/services/deleteAgendaItem';
import { z } from 'zod';
import { ValidationError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';

const UpdateAgendaItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

export const PATCH = withAssociation(
  { body: UpdateAgendaItemSchema },
  async (association, { body, traceId }, request, { params }) => {
    logger.info(
      { traceId, associationId: association.id },
      'PATCH /api/meetings/[meetingId]/agenda/[itemId] - Request started',
    );

    const user = await withRole(request, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, role: user.role },
      'PATCH /api/meetings/[meetingId]/agenda/[itemId] - User authorized',
    );

    if (!body) {
      throw new ValidationError('Invalid body');
    }

    const { itemId } = (await params) as { itemId: string };

    logger.info(
      { traceId, itemId },
      'PATCH /api/meetings/[meetingId]/agenda/[itemId] - Updating agenda item',
    );

    const item = await updateAgendaItem({
      where: { id: itemId },
      data: body,
    });

    logger.info({ traceId, itemId }, 'PATCH /api/meetings/[meetingId]/agenda/[itemId] - Success');

    return SuccessResponse({ data: item });
  },
);

export const DELETE = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info(
    { traceId, associationId: association.id },
    'DELETE /api/meetings/[meetingId]/agenda/[itemId] - Request started',
  );

  const user = await withRole(request, UserRole.SECRETARY);
  logger.info(
    { traceId, userId: user.id, role: user.role },
    'DELETE /api/meetings/[meetingId]/agenda/[itemId] - User authorized',
  );

  const { itemId } = (await params) as { itemId: string };

  logger.info(
    { traceId, itemId },
    'DELETE /api/meetings/[meetingId]/agenda/[itemId] - Deleting agenda item',
  );

  const item = await deleteAgendaItem({
    where: { id: itemId },
  });

  logger.info({ traceId, itemId }, 'DELETE /api/meetings/[meetingId]/agenda/[itemId] - Success');

  return SuccessResponse({ data: item });
});
