import { Request, Response, NextFunction } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findUniqueMeeting } from '@src/features/meetings/services';
import { MeetingQuerySchema } from '@src/features/meetings/validators';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger';
import { z } from 'zod';
import { getAssociation, withRole } from '../_helpers';

const MeetingParamsSchema = z.object({
  meetingId: z.string('Invalid meeting ID'),
});

export const getAttendees = [
  validate({ params: MeetingParamsSchema, query: MeetingQuerySchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      const meetingId = req.params.meetingId as string;
      logger.info({ traceId, meetingId, associationId: association.id }, 'GET /api/meetings/[meetingId]/attendees - Request started');

      const user = await withRole(req, UserRole.MEMBER);
      logger.info({ traceId, userId: user.id, role: user.role, meetingId }, 'GET /api/meetings/[meetingId]/attendees - User authorized');

      const meeting = await findUniqueMeeting({ meetingId, associationId: association.id });

      if (!hasHighRoleAccess(user.role)) {
        const myAttendance = meeting.attendees.find(
          (a: { user: { id: string } }) => a.user.id === user.id,
        );
        if (!myAttendance) {
          throw new ForbiddenError('You are not assigned to this meeting');
        }
      }

      logger.info({ traceId, meetingId: meeting.id, attendeeCount: meeting.attendees.length }, 'GET /api/meetings/[meetingId]/attendees - Success');
      return success(res, { data: meeting.attendees });
    } catch (e) { next(e); }
  },
];
