import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole, MeetingStatus } from '@prisma/client';
import { updateMeeting } from '@src/features/meetings/services/updateMeeting';
import { logger } from '@src/shared/logger/server';

export const POST = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info(
    { traceId, associationId: association.id },
    'POST /api/meetings/[meetingId]/notice - Request started',
  );

  const user = await withRole(request, UserRole.SECRETARY);

  const { meetingId } = (await params) as { meetingId: string };

  logger.info(
    { traceId, userId: user.id, role: user.role, meetingId },
    'POST /api/meetings/[meetingId]/notice - User authorized',
  );

  logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/notice - Issuing notice');

  const meeting = await updateMeeting({
    meetingId,
    associationId: association.id,
    data: {
      status: MeetingStatus.NOTICE_ISSUED,
      noticeIssuedAt: new Date(),
    },
  });

  logger.info(
    { traceId, meetingId: meeting.id },
    'POST /api/meetings/[meetingId]/notice - Success',
  );

  return SuccessResponse({ data: meeting });
});
