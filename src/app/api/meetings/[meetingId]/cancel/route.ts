import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole, MeetingStatus } from '@prisma/client';
import { updateMeeting } from '@src/features/meetings/services/updateMeeting';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { ForbiddenError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';

export const POST = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info(
    { traceId, associationId: association.id },
    'POST /api/meetings/[meetingId]/cancel - Request started',
  );

  const user = await withRole(request, UserRole.PRESIDENT);

  if (!hasHighRoleAccess(user.role)) {
    throw new ForbiddenError('Only president or super admin can cancel meetings');
  }

  const { meetingId } = (await params) as { meetingId: string };

  logger.info(
    { traceId, userId: user.id, role: user.role, meetingId },
    'POST /api/meetings/[meetingId]/cancel - User authorized',
  );

  logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/cancel - Cancelling meeting');

  const meeting = await updateMeeting({
    meetingId,
    associationId: association.id,
    data: {
      status: MeetingStatus.CANCELLED,
    },
  });

  logger.info(
    { traceId, meetingId: meeting.id },
    'POST /api/meetings/[meetingId]/cancel - Success',
  );

  return SuccessResponse({ data: meeting });
});
