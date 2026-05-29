import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { ForbiddenError } from '@src/shared/errors';
import { BulkAssignAttendeesSchema } from '@src/features/meetings';
import { bulkAssignAttendees } from '@src/features/meetings/services/bulkAssignAttendees';
import { logger } from '@src/shared/logger/server';

export const POST = withAssociation(
  { body: BulkAssignAttendeesSchema },
  async (association, { body, traceId }, request, { params }) => {
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/meetings/[meetingId]/attendees/bulk - Request started',
    );

    const user = await withRole(request, UserRole.SECRETARY);

    if (!body) {
      throw new ForbiddenError('Invalid body');
    }

    const { meetingId } = (await params) as { meetingId: string };

    logger.info(
      { traceId, userId: user.id, role: user.role, meetingId },
      'POST /api/meetings/[meetingId]/attendees/bulk - User authorized',
    );

    logger.info(
      { traceId, meetingId },
      'POST /api/meetings/[meetingId]/attendees/bulk - Bulk assigning attendees',
    );

    await bulkAssignAttendees({
      meetingId,
      associationId: association.id,
      userIds: body.userIds,
    });

    logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/attendees/bulk - Success');

    return SuccessResponse({
      data: null,
      message: 'Bulk assignment successful',
    });
  },
);
