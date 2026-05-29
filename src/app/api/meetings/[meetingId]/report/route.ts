import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { findUniqueMeeting } from '@src/features/meetings/services/findUniqueMeeting';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info(
    { traceId, associationId: association.id },
    'GET /api/meetings/[meetingId]/report - Request started',
  );

  const user = await withRole(request, UserRole.SECRETARY);

  const { meetingId } = (await params) as { meetingId: string };

  logger.info(
    { traceId, userId: user.id, role: user.role, meetingId },
    'GET /api/meetings/[meetingId]/report - User authorized',
  );

  logger.info(
    { traceId, meetingId },
    'GET /api/meetings/[meetingId]/report - Fetching meeting report',
  );

  const meeting = await findUniqueMeeting({
    meetingId,
    associationId: association.id,
  });

  logger.info({ traceId, meetingId: meeting.id }, 'GET /api/meetings/[meetingId]/report - Success');

  return SuccessResponse({ data: meeting });
});
