import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { updateMeetingMinute } from '@src/features/meetings/services/minutes';
import { UpdateMeetingMinuteSchema } from '@src/features/meetings/validators/minutes';
import { logger } from '@src/shared/logger';
import { z } from 'zod';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

const ParamsSchema = z.object({
  meetingId: z.string('Invalid meeting ID'),
  minutesId: z.string('Invalid minute ID'),
});

/** PATCH /api/meetings/[meetingId]/minutes/[minutesId] - Update a meeting minute. */
export const patchUpdateMinute: RequestHandler[] = [
  validate({ params: ParamsSchema, body: UpdateMeetingMinuteSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const meetingId = req.params.meetingId as string;
    const minutesId = req.params.minutesId as string;
    logger.info(
      { traceId, meetingId, minutesId, associationId: association.id },
      'PATCH /api/meetings/[meetingId]/minutes/[minutesId] - Request started',
    );

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, role: user.role, meetingId, minutesId },
      'PATCH /api/meetings/[meetingId]/minutes/[minutesId] - User authorized',
    );
    logger.info(
      { traceId, meetingId, minutesId },
      'PATCH /api/meetings/[meetingId]/minutes/[minutesId] - Updating meeting minute',
    );

    const minute = await updateMeetingMinute({
      meetingId,
      minuteId: minutesId,
      associationId: association.id,
      data: req.body,
    });

    logger.info(
      { traceId, meetingId, minutesId },
      'PATCH /api/meetings/[meetingId]/minutes/[minutesId] - Success',
    );
    return success(res, { data: minute, message: 'Meeting minute updated successfully' });
  }),
];
