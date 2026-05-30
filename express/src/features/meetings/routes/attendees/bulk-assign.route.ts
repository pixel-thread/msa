import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { ForbiddenError } from '@src/shared/errors';
import { BulkAssignAttendeesSchema } from '@src/features/meetings/validators';
import { bulkAssignAttendees } from '@src/features/meetings/services/bulkAssignAttendees';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** POST /api/meetings/[meetingId]/attendees/bulk - Bulk assign attendees to a meeting. */
export const postBulkAssignAttendees: RequestHandler[] = [
  validate({ body: BulkAssignAttendeesSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/meetings/[meetingId]/attendees/bulk - Request started',
    );

    const user = await withRole(req, UserRole.SECRETARY);
    const meetingId = req.params.meetingId as string;
    logger.info(
      { traceId, userId: user.id, role: user.role, meetingId },
      'POST /api/meetings/[meetingId]/attendees/bulk - User authorized',
    );
    logger.info(
      { traceId, meetingId },
      'POST /api/meetings/[meetingId]/attendees/bulk - Bulk assigning attendees',
    );

    await bulkAssignAttendees({
      meetingId,
      associationId: association.id,
      userIds: req.body.userIds,
    });

    logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/attendees/bulk - Success');
    return success(res, { data: null, message: 'Bulk assignment successful' });
  }),
];
