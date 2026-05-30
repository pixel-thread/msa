import { Request, Response } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole, MeetingStatus } from '@prisma/client';
import { updateMeeting } from '@src/features/meetings/services';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { ForbiddenError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';

export const postCancelMeeting = async (req: Request, res: Response) => {
  const traceId = (req.headers['x-trace-id'] as string) || '';
  const association = await getAssociation(req);
  logger.info({ traceId, associationId: association.id }, 'POST /api/meetings/[meetingId]/cancel - Request started');

  const user = await withRole(req, UserRole.PRESIDENT);
  if (!hasHighRoleAccess(user.role)) {
    throw new ForbiddenError('Only president or super admin can cancel meetings');
  }

  const meetingId = req.params.meetingId as string;
  logger.info({ traceId, userId: user.id, role: user.role, meetingId }, 'POST /api/meetings/[meetingId]/cancel - User authorized');
  logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/cancel - Cancelling meeting');

  const meeting = await updateMeeting({
    meetingId,
    associationId: association.id,
    data: { status: MeetingStatus.CANCELLED },
  });

  logger.info({ traceId, meetingId: meeting.id }, 'POST /api/meetings/[meetingId]/cancel - Success');
  return success(res, { data: meeting });
};
