import { Request, Response, NextFunction } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { findUniqueMeeting } from '@src/features/meetings/services/findUniqueMeeting';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';

export const getMeetingReport = async (req: Request, res: Response, next: NextFunction) => {
  const traceId = (req.headers['x-trace-id'] as string) || '';
  try {
    const association = await getAssociation(req);
    const user = await withRole(req, UserRole.SECRETARY);

    const meetingId = req.params.meetingId as string;
    logger.info({ traceId, userId: user.id, role: user.role, meetingId }, 'GET /api/meetings/[meetingId]/report - User authorized');
    logger.info({ traceId, meetingId }, 'GET /api/meetings/[meetingId]/report - Fetching meeting report');

    const meeting = await findUniqueMeeting({ meetingId, associationId: association.id });

    logger.info({ traceId, meetingId: meeting.id }, 'GET /api/meetings/[meetingId]/report - Success');
    return success(res, { data: meeting });
  } catch (e) { next(e); }
};
