import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { createMeetingMinute } from '@src/features/meetings/services/minutes';
import { CreateMeetingMinuteSchema } from '@src/features/meetings/validators/minutes';
import { logger } from '@src/shared/logger';
import { z } from 'zod';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

const ParamsSchema = z.object({
  meetingId: z.string('Invalid meeting ID'),
});

/** POST /api/meetings/[meetingId]/minutes - Record a meeting minute. */
export const postCreateMinute: RequestHandler[] = [
  validate({ params: ParamsSchema, body: CreateMeetingMinuteSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const meetingId = req.params.meetingId as string;
    logger.info(
      { traceId, meetingId, associationId: association.id },
      'POST /api/meetings/[meetingId]/minutes - Request started',
    );

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, role: user.role, meetingId },
      'POST /api/meetings/[meetingId]/minutes - User authorized',
    );
    logger.info(
      { traceId, meetingId },
      'POST /api/meetings/[meetingId]/minutes - Creating meeting minute',
    );

    const minute = await createMeetingMinute({
      meetingId,
      associationId: association.id,
      data: req.body,
    });

    logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/minutes - Success');
    return success(res, { data: minute, message: 'Meeting minute recorded successfully' });
  }),
];
