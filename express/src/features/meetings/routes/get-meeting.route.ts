import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findUniqueMeeting } from '@src/features/meetings/services';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger';
import { z } from 'zod';
import { getAssociation, withRole } from './_helpers';

const MeetingParamsSchema = z.object({
  meetingId: z.string('Invalid meeting ID'),
});

export const getMeeting = [
  validate({ params: MeetingParamsSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    const meetingId = req.params.meetingId as string;
    logger.info({ traceId, meetingId, associationId: association.id }, 'GET /api/meetings/[meetingId] - Request started');

    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id, role: user.role }, 'GET /api/meetings/[meetingId] - User authorized');

    const userId = req.headers['x-user-id'] as string;

    const meeting = await findUniqueMeeting({ meetingId, associationId: association.id });

    if (!hasHighRoleAccess(user.role)) {
      const isAttendee = meeting.attendees.some((a: { user: { id: string } }) => a.user.id === userId);
      if (!isAttendee) {
        throw new ForbiddenError('You are not assigned to this meeting');
      }
    }

    logger.info({ traceId, meetingId: meeting.id }, 'GET /api/meetings/[meetingId] - Success');
    return success(res, { data: meeting });
  },
];
