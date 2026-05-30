import { Request, NextFunction, Response, RequestHandler } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole, MeetingStatus } from '@prisma/client';
import { updateMeeting } from '@src/features/meetings/services/updateMeeting';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** POST /api/meetings/[meetingId]/notice - Issue a notice for a meeting. */
export const postIssueNotice: RequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/meetings/[meetingId]/notice - Request started',
    );

    const user = await withRole(req, UserRole.SECRETARY);

    const meetingId = req.params.meetingId as string;
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
    return success(res, { data: meeting });
  },
);
