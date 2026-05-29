import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { ForbiddenError, ValidationError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const AttendeeParamsSchema = z.object({
  meetingId: z.uuid('Invalid meeting ID'),
});

const RsvpSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
  note: z
    .string()
    .max(300)
    .optional()
    .transform((v) => v?.trim()),
});

export const POST = withAssociation(
  { params: AttendeeParamsSchema, body: RsvpSchema },
  async (_association, { params, body, traceId }, request) => {
    logger.info(
      { traceId, meetingId: params?.meetingId },
      'POST /api/meetings/[meetingId]/rsvp - Request started',
    );

    if (!params) {
      throw new ForbiddenError('Invalid parameters');
    }

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const user = await withRole(request, UserRole.MEMBER);
    logger.info(
      {
        traceId,
        userId: user.id,
        role: user.role,
        meetingId: params.meetingId,
      },
      'POST /api/meetings/[meetingId]/rsvp - User authorized',
    );

    // Member submitting own RSVP
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      throw new ForbiddenError('Unauthorized');
    }

    logger.info(
      { traceId, meetingId: params.meetingId, userId },
      'POST /api/meetings/[meetingId]/rsvp - Submitting RSVP',
    );

    const updated = await prisma.meetingAttendee.update({
      where: {
        meetingId_userId: {
          meetingId: params.meetingId,
          userId: userId,
        },
      },
      data: {
        rsvpStatus: body.status,
        rsvpNote: body.note,
        rsvpAt: new Date(),
      },
    });

    logger.info(
      { traceId, meetingId: params.meetingId },
      'POST /api/meetings/[meetingId]/rsvp - Success',
    );

    return SuccessResponse({
      data: updated,
      message: 'RSVP submitted successfully',
    });
  },
);
