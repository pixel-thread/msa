import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { createMeetingMinute, getMeetingMinuites } from '@feature/meetings/services/minutes';
import { CreateMeetingMinuteSchema } from '@feature/meetings/validators/minutes';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const ParamsSchema = z.object({
  meetingId: z.uuid('Invalid meeting ID'),
});

export const GET = withAssociation(
  { params: ParamsSchema },
  async (_association, { params, traceId }, req) => {
    logger.info(
      { traceId, meetingId: params?.meetingId },
      'GET /api/meetings/[meetingId]/minutes - Request started',
    );

    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      {
        traceId,
        userId: user.id,
        role: user.role,
        meetingId: params?.meetingId,
      },
      'GET /api/meetings/[meetingId]/minutes - User authorized',
    );

    const minuites = await getMeetingMinuites({
      where: { meetingId: params?.meetingId },
    });

    logger.info(
      { traceId, meetingId: params?.meetingId, count: minuites.length },
      'GET /api/meetings/[meetingId]/minutes - Success',
    );

    return SuccessResponse({
      data: minuites,
      message: 'Meeting minuites fetch successfully',
    });
  },
);

export const POST = withAssociation(
  { params: ParamsSchema, body: CreateMeetingMinuteSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId, associationId: association.id },
      'POST /api/meetings/[meetingId]/minutes - Request started',
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
      'POST /api/meetings/[meetingId]/minutes - User authorized',
    );

    logger.info(
      { traceId, meetingId: params?.meetingId },
      'POST /api/meetings/[meetingId]/minutes - Creating meeting minute',
    );

    const minute = await createMeetingMinute({
      meetingId: params!.meetingId,
      associationId: association.id,
      data: body!,
    });

    logger.info(
      { traceId, meetingId: params!.meetingId },
      'POST /api/meetings/[meetingId]/minutes - Success',
    );

    return SuccessResponse({
      data: minute,
      message: 'Meeting minute recorded successfully',
    });
  },
);
