import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findUniqueMeeting, assignAttendee, bulkAssignAttendees } from '@feature/meetings/services';

import {
  AssignAttendeeSchema,
  BulkAssignAttendeesSchema,
  MeetingQuerySchema,
} from '@feature/meetings/validators';
import { z } from 'zod';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger/server';

const MeetingParamsSchema = z.object({
  meetingId: z.string('Invalid meeting ID'),
});

export const GET = withAssociation(
  { params: MeetingParamsSchema, query: MeetingQuerySchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId, associationId: association.id },
      'GET /api/meetings/[meetingId]/attendees - Request started',
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
      'GET /api/meetings/[meetingId]/attendees - User authorized',
    );

    const meeting = await findUniqueMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    if (!hasHighRoleAccess(user.role)) {
      const myAttendance = meeting.attendees.find(
        (a: { user: { id: string } }) => a.user.id === user.id,
      );

      if (!myAttendance) {
        throw new ForbiddenError('You are not assigned to this meeting');
      }
    }

    logger.info(
      {
        traceId,
        meetingId: meeting.id,
        attendeeCount: meeting.attendees.length,
      },
      'GET /api/meetings/[meetingId]/attendees - Success',
    );

    return SuccessResponse({
      data: meeting.attendees,
    });
  },
);

export const POST = withAssociation(
  { params: MeetingParamsSchema, body: AssignAttendeeSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId, associationId: association.id },
      'POST /api/meetings/[meetingId]/attendees - Request started',
    );

    if (!params) {
      throw new ForbiddenError('Invalid meeting ID');
    }
    if (!body) {
      throw new ForbiddenError('Invalid request body');
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError('Only secretary, president, or super admin can assign attendees');
    }

    logger.info(
      {
        traceId,
        userId: user.id,
        role: user.role,
        meetingId: params.meetingId,
      },
      'POST /api/meetings/[meetingId]/attendees - User authorized',
    );

    logger.info(
      { traceId, meetingId: params.meetingId, attendeeUserId: body.userId },
      'POST /api/meetings/[meetingId]/attendees - Assigning attendee',
    );

    const attendee = await assignAttendee({
      meetingId: params.meetingId,
      associationId: association.id,
      userId: body.userId,
      attendeeRole: body.attendeeRole,
    });

    logger.info(
      { traceId, meetingId: params.meetingId },
      'POST /api/meetings/[meetingId]/attendees - Success',
    );

    return SuccessResponse({ data: attendee }, 201);
  },
);

export const PUT = withAssociation(
  { params: MeetingParamsSchema, body: BulkAssignAttendeesSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId, associationId: association.id },
      'PUT /api/meetings/[meetingId]/attendees - Request started',
    );

    if (!params) {
      throw new ForbiddenError('Invalid meeting ID');
    }

    if (!body) {
      throw new ForbiddenError('Invalid request body');
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError(
        'Only secretary, president, or super admin can bulk assign attendees',
      );
    }

    logger.info(
      {
        traceId,
        userId: user.id,
        role: user.role,
        meetingId: params.meetingId,
      },
      'PUT /api/meetings/[meetingId]/attendees - User authorized',
    );

    logger.info(
      { traceId, meetingId: params.meetingId },
      'PUT /api/meetings/[meetingId]/attendees - Bulk assigning attendees',
    );

    const result = await bulkAssignAttendees({
      meetingId: params.meetingId,
      associationId: association.id,
      userIds: body.userIds,
      attendeeRole: body.attendeeRole,
    });

    logger.info(
      {
        traceId,
        meetingId: params.meetingId,
        assigned: result.assigned.length,
        skipped: result.skipped.length,
      },
      'PUT /api/meetings/[meetingId]/attendees - Success',
    );

    return SuccessResponse({
      data: result,
      message: `Assigned ${result.assigned.length} attendees, skipped ${result.skipped.length} existing`,
    });
  },
);
