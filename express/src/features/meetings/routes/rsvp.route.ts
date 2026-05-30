import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError, ValidationError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { updateAttendee } from '@src/features/meetings/services/updateAttendee';
import { z } from 'zod';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

const RsvpSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
  note: z
    .string()
    .max(300)
    .optional()
    .transform((v) => v?.trim()),
});

/** POST /api/meetings/[meetingId]/rsvp - Submit an RSVP for a meeting. */
export const postRsvp: RequestHandler[] = [
  validate({ body: RsvpSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const meetingId = req.params.meetingId as string;
    logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/rsvp - Request started');

    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, role: user.role, meetingId },
      'POST /api/meetings/[meetingId]/rsvp - User authorized',
    );

    const userId = req.userId as string;
    if (!userId) throw new ForbiddenError('Unauthorized');

    logger.info(
      { traceId, meetingId, userId },
      'POST /api/meetings/[meetingId]/rsvp - Submitting RSVP',
    );

    const updated = await updateAttendee({
      meetingId,
      associationId: association.id,
      userId,
      data: {
        rsvpStatus: req.body.status,
        rsvpNote: req.body.note,
      },
    });

    logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/rsvp - Success');
    return success(res, { data: updated, message: 'RSVP submitted successfully' });
  }),
];
