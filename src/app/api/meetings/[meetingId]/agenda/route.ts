import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { processAgendaOperations } from '@src/features/meetings/services/processAgendaOperations';
import {
  AgendaOperationSchema,
  CreateAgendaItemSchema,
} from '@feature/meetings/validators/agenda-items';
import { z } from 'zod';
import { ForbiddenError } from '@src/shared/errors';
import { findUniqueMeeting } from '@src/features/meetings/services/findUniqueMeeting';
import { createAgendaItem } from '@src/features/meetings/services/createAgendaItem';
import { countAgendaItems } from '@src/features/meetings/services/countAgendaItems';
import { logger } from '@src/shared/logger/server';

const ParamsSchema = z.object({ meetingId: z.string('Invalid meeting ID') });

export const GET = withAssociation(
  { params: ParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId, associationId: association.id },
      'GET /api/meetings/[meetingId]/agenda - Request started',
    );

    if (!params) {
      throw new ForbiddenError('Invalid meeting ID');
    }

    const user = await withRole(request, UserRole.MEMBER);
    logger.info(
      {
        traceId,
        userId: user.id,
        role: user.role,
        meetingId: params.meetingId,
      },
      'GET /api/meetings/[meetingId]/agenda - User authorized',
    );

    const meeting = await findUniqueMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    const agenda = meeting.agendaItems;

    logger.info(
      { traceId, meetingId: meeting.id },
      'GET /api/meetings/[meetingId]/agenda - Success',
    );

    return SuccessResponse({ data: agenda });
  },
);

export const POST = withAssociation(
  { params: ParamsSchema, body: CreateAgendaItemSchema },
  async (_association, { params, body, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId },
      'POST /api/meetings/[meetingId]/agenda - Request started',
    );

    const user = await withRole(request, UserRole.SECRETARY);
    logger.info(
      {
        traceId,
        userId: user.id,
        role: user.role,
        meetingId: params?.meetingId,
      },
      'POST /api/meetings/[meetingId]/agenda - User authorized',
    );

    if (!body) {
      throw new ForbiddenError('Invalid request body');
    }

    logger.info(
      { traceId, meetingId: params?.meetingId },
      'POST /api/meetings/[meetingId]/agenda - Creating agenda item',
    );

    let order = body.order;

    if (order === undefined) {
      const count = await countAgendaItems({ meetingId: params!.meetingId });
      order = count + 1;
    }

    const item = await createAgendaItem({
      meetingId: params!.meetingId,
      title: body.title,
      description: body.description,
      order,
    });

    logger.info(
      { traceId, meetingId: params!.meetingId, agendaItemId: item.id },
      'POST /api/meetings/[meetingId]/agenda - Success',
    );

    return SuccessResponse({
      data: item,
      message: 'Agenda item created successfully',
    });
  },
);

export const PATCH = withAssociation(
  { params: ParamsSchema, body: AgendaOperationSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId, associationId: association.id },
      'PATCH /api/meetings/[meetingId]/agenda - Request started',
    );

    // Check for administrative roles (Secretary and above)
    const user = await withRole(request, UserRole.SECRETARY);
    logger.info(
      {
        traceId,
        userId: user.id,
        role: user.role,
        meetingId: params?.meetingId,
      },
      'PATCH /api/meetings/[meetingId]/agenda - User authorized',
    );

    // params and body are guaranteed to be defined because of withAssociation/withValidation
    logger.info(
      { traceId, meetingId: params?.meetingId },
      'PATCH /api/meetings/[meetingId]/agenda - Processing agenda operations',
    );

    const items = await processAgendaOperations({
      meetingId: params!.meetingId,
      associationId: association.id,
      operations: body!.operations,
    });

    logger.info(
      { traceId, meetingId: params!.meetingId },
      'PATCH /api/meetings/[meetingId]/agenda - Success',
    );

    return SuccessResponse({
      data: items,
      message: 'Agenda updated successfully',
    });
  },
);
