import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { deleteMeetingMinute, updateMeetingMinute } from '@feature/meetings/services/minutes';
import { UpdateMeetingMinuteSchema } from '@feature/meetings/validators/minutes';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const ParamsSchema = z.object({
  meetingId: z.uuid('Invalid meeting ID'),
  minutesId: z.uuid('Invalid minute ID'),
});

export const PATCH = withAssociation(
  { params: ParamsSchema, body: UpdateMeetingMinuteSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info(
      {
        traceId,
        meetingId: params?.meetingId,
        minutesId: params?.minutesId,
        associationId: association.id,
      },
      'PATCH /api/meetings/[meetingId]/minutes/[minutesId] - Request started',
    );

    // Check for administrative roles (Secretary and above)
    const user = await withRole(request, UserRole.SECRETARY);
    logger.info(
      {
        traceId,
        userId: user.id,
        role: user.role,
        meetingId: params?.meetingId,
        minutesId: params?.minutesId,
      },
      'PATCH /api/meetings/[meetingId]/minutes/[minutesId] - User authorized',
    );

    logger.info(
      { traceId, meetingId: params?.meetingId, minutesId: params?.minutesId },
      'PATCH /api/meetings/[meetingId]/minutes/[minutesId] - Updating meeting minute',
    );

    const minute = await updateMeetingMinute({
      meetingId: params!.meetingId,
      minuteId: params!.minutesId,
      associationId: association.id,
      data: body!,
    });

    logger.info(
      { traceId, meetingId: params!.meetingId, minutesId: params!.minutesId },
      'PATCH /api/meetings/[meetingId]/minutes/[minutesId] - Success',
    );

    return SuccessResponse({
      data: minute,
      message: 'Meeting minute updated successfully',
    });
  },
);

export const DELETE = withAssociation(
  { params: ParamsSchema },
  async (_association, { params, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId, minutesId: params?.minutesId },
      'DELETE /api/meetings/[meetingId]/minutes/[minutesId] - Request started',
    );

    // Check for administrative roles (Secretary and above)
    const user = await withRole(request, UserRole.SECRETARY);
    logger.info(
      {
        traceId,
        userId: user.id,
        role: user.role,
        meetingId: params?.meetingId,
        minutesId: params?.minutesId,
      },
      'DELETE /api/meetings/[meetingId]/minutes/[minutesId] - User authorized',
    );

    logger.info(
      { traceId, meetingId: params?.meetingId, minutesId: params?.minutesId },
      'DELETE /api/meetings/[meetingId]/minutes/[minutesId] - Deleting meeting minute',
    );

    const deletedMinute = await deleteMeetingMinute({
      where: {
        id: params!.minutesId,
        meetingId: params!.meetingId,
      },
    });

    logger.info(
      { traceId, meetingId: params!.meetingId, minutesId: params!.minutesId },
      'DELETE /api/meetings/[meetingId]/minutes/[minutesId] - Success',
    );

    return SuccessResponse({
      data: deletedMinute,
      message: 'Meeting minute deleted successfully',
    });
  },
);
