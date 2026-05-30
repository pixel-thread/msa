import { Request, NextFunction, Response } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole, MeetingStatus } from '@prisma/client';
import { updateMeeting } from '@src/features/meetings/services/updateMeeting';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';

export const postIssueNotice = async (req: Request, res: Response, _next?: NextFunction) => {
  const traceId = (req.headers['x-trace-id'] as string) || '';
  const association = await getAssociation(req);
  logger.info({ traceId, associationId: association.id }, 'POST /api/meetings/[meetingId]/notice - Request started');

  const user = await withRole(req, UserRole.SECRETARY);

  const meetingId = req.params.meetingId as string;
  logger.info({ traceId, userId: user.id, role: user.role, meetingId }, 'POST /api/meetings/[meetingId]/notice - User authorized');
  logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/notice - Issuing notice');

  const meeting = await updateMeeting({
    meetingId,
    associationId: association.id,
    data: {
      status: MeetingStatus.NOTICE_ISSUED,
      noticeIssuedAt: new Date(),
    },
  });

  logger.info({ traceId, meetingId: meeting.id }, 'POST /api/meetings/[meetingId]/notice - Success');
  return success(res, { data: meeting });
};
