import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { updateAttendee, removeAttendee } from '@src/features/meetings/services';
import { UpdateAttendeeSchema } from '@src/features/meetings/validators';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger';
import { z } from 'zod';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

const AttendeeParamsSchema = z.object({
  meetingId: z.string('Invalid meeting ID'),
  userId: z.string('Invalid user ID'),
});

/** PATCH /api/meetings/[meetingId]/attendees/[userId] - Update an attendee's role or RSVP. */
export const patchUpdateAttendee: RequestHandler[] = [
  validate({ params: AttendeeParamsSchema, body: UpdateAttendeeSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const meetingId = req.params.meetingId as string;
    const targetUserId = req.params.userId as string;
    logger.info(
      { traceId, meetingId, targetUserId, associationId: association.id },
      'PATCH /api/meetings/[meetingId]/attendees/[userId] - Request started',
    );

    const user = await withRole(req, UserRole.MEMBER);
    const requestingUserId = req.userId as string;

    logger.info(
      { traceId, userId: user.id, role: user.role, meetingId, targetUserId },
      'PATCH /api/meetings/[meetingId]/attendees/[userId] - User authorized',
    );

    const isAdmin = hasHighRoleAccess(user.role);
    const isSelfUpdate = targetUserId === requestingUserId;

    if (!isAdmin && !isSelfUpdate) {
      throw new ForbiddenError('You can only update your own RSVP');
    }

    logger.info(
      { traceId, meetingId, targetUserId },
      'PATCH /api/meetings/[meetingId]/attendees/[userId] - Updating attendee',
    );

    const updated = await updateAttendee({
      meetingId,
      associationId: association.id,
      userId: targetUserId,
      data: req.body,
      isAdminUpdate: isAdmin,
    });

    logger.info(
      { traceId, meetingId, targetUserId },
      'PATCH /api/meetings/[meetingId]/attendees/[userId] - Success',
    );
    return success(res, { data: updated });
  }),
];

/** DELETE /api/meetings/[meetingId]/attendees/[userId] - Remove an attendee from a meeting. */
export const deleteRemoveAttendee = async (req: Request, res: Response, _next: NextFunction) => {
  const traceId = (req.traceId as string) || '';
  const association = await getAssociation(req);
  const meetingId = req.params.meetingId as string;
  const targetUserId = req.params.userId as string;
  logger.info(
    { traceId, meetingId, targetUserId, associationId: association.id },
    'DELETE /api/meetings/[meetingId]/attendees/[userId] - Request started',
  );

  const user = await withRole(req, UserRole.SECRETARY);
  if (!hasHighRoleAccess(user.role)) {
    throw new ForbiddenError('Only secretary, president, or super admin can remove attendees');
  }

  logger.info(
    { traceId, userId: user.id, role: user.role, meetingId, targetUserId },
    'DELETE /api/meetings/[meetingId]/attendees/[userId] - User authorized',
  );
  logger.info(
    { traceId, meetingId, targetUserId },
    'DELETE /api/meetings/[meetingId]/attendees/[userId] - Removing attendee',
  );

  await removeAttendee({ meetingId, associationId: association.id, userId: targetUserId });

  logger.info(
    { traceId, meetingId, targetUserId },
    'DELETE /api/meetings/[meetingId]/attendees/[userId] - Success',
  );
  return success(res, { data: { success: true }, message: 'Attendee removed successfully' });
};
