import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findUniqueMeeting, updateMeeting, deleteMeeting } from '@feature/meetings/services';
import { UpdateMeetingSchema } from '@feature/meetings/validators/meetings';
import { z } from 'zod';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger/server';

const MeetingParamsSchema = z.object({
  meetingId: z.string('Invalid meeting ID'),
});

export const GET = withAssociation(
  { params: MeetingParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId, associationId: association.id },
      'GET /api/meetings/[meetingId] - Request started',
    );

    if (!params) {
      throw new ForbiddenError('Invalid meeting ID');
    }

    const user = await withRole(request, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, role: user.role },
      'GET /api/meetings/[meetingId] - User authorized',
    );

    const userId = request.headers.get('x-user-id')!;

    const meeting = await findUniqueMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    if (!hasHighRoleAccess(user.role)) {
      const isAttendee = meeting.attendees.some(
        (a: { user: { id: string } }) => a.user.id === userId,
      );
      if (!isAttendee) {
        throw new ForbiddenError('You are not assigned to this meeting');
      }
    }

    logger.info({ traceId, meetingId: meeting.id }, 'GET /api/meetings/[meetingId] - Success');

    return SuccessResponse({
      data: meeting,
    });
  },
);

export const PATCH = withAssociation(
  { params: MeetingParamsSchema, body: UpdateMeetingSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId, associationId: association.id },
      'PATCH /api/meetings/[meetingId] - Request started',
    );

    if (!params) {
      throw new ForbiddenError('Invalid meeting ID');
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError('Only secretary, president, or super admin can update meetings');
    }

    logger.info(
      {
        traceId,
        userId: user.id,
        role: user.role,
        meetingId: params.meetingId,
      },
      'PATCH /api/meetings/[meetingId] - User authorized',
    );

    logger.info(
      { traceId, meetingId: params.meetingId },
      'PATCH /api/meetings/[meetingId] - Updating meeting',
    );

    const updateData: Record<string, unknown> = { ...body };
    if (body?.scheduledAt) {
      updateData.scheduledAt = new Date(body.scheduledAt);
    }

    const meeting = await updateMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
      data: updateData as Parameters<typeof updateMeeting>[0]['data'],
    });

    logger.info({ traceId, meetingId: meeting.id }, 'PATCH /api/meetings/[meetingId] - Success');

    return SuccessResponse({ data: meeting });
  },
);

export const DELETE = withAssociation(
  { params: MeetingParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId, associationId: association.id },
      'DELETE /api/meetings/[meetingId] - Request started',
    );

    if (!params) {
      throw new ForbiddenError('Invalid meeting ID');
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError('Only secretary, president, or super admin can delete meetings');
    }

    logger.info(
      {
        traceId,
        userId: user.id,
        role: user.role,
        meetingId: params.meetingId,
      },
      'DELETE /api/meetings/[meetingId] - User authorized',
    );

    logger.info(
      { traceId, meetingId: params.meetingId },
      'DELETE /api/meetings/[meetingId] - Deleting meeting',
    );

    const deletedMeeting = await deleteMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    logger.info(
      { traceId, meetingId: deletedMeeting.id },
      'DELETE /api/meetings/[meetingId] - Success',
    );

    return SuccessResponse({
      data: deletedMeeting,
      message: 'Meeting deleted successfully',
    });
  },
);
