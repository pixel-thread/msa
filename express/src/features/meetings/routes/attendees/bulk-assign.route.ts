import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { ForbiddenError } from '@src/shared/errors';
import { BulkAssignAttendeesSchema } from '@src/features/meetings/validators';
import { bulkAssignAttendees } from '@src/features/meetings/services/bulkAssignAttendees';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from '../_helpers';

export const postBulkAssignAttendees = [
  validate({ body: BulkAssignAttendeesSchema }),
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'POST /api/meetings/[meetingId]/attendees/bulk - Request started');

    const user = await withRole(req, UserRole.SECRETARY);
    const meetingId = req.params.meetingId as string;
    logger.info({ traceId, userId: user.id, role: user.role, meetingId }, 'POST /api/meetings/[meetingId]/attendees/bulk - User authorized');
    logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/attendees/bulk - Bulk assigning attendees');

    await bulkAssignAttendees({
      meetingId,
      associationId: association.id,
      userIds: req.body.userIds,
    });

    logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/attendees/bulk - Success');
    return success(res, { data: null, message: 'Bulk assignment successful' });
  },
];
