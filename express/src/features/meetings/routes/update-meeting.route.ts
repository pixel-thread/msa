import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { updateMeeting } from '@src/features/meetings/services';
import { UpdateMeetingSchema } from '@src/features/meetings/validators/meetings';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger';
import { z } from 'zod';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

const MeetingParamsSchema = z.object({
  meetingId: z.string('Invalid meeting ID'),
});

/** PATCH /api/meetings/[meetingId] - Update a meeting. */
export const patchUpdateMeeting: RequestHandler[] = [
  validate({ params: MeetingParamsSchema, body: UpdateMeetingSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const meetingId = req.params.meetingId as string;
    logger.info(
      { traceId, meetingId, associationId: association.id },
      'PATCH /api/meetings/[meetingId] - Request started',
    );

    const user = await withRole(req, UserRole.SECRETARY);
    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError('Only secretary, president, or super admin can update meetings');
    }

    logger.info(
      { traceId, userId: user.id, role: user.role, meetingId },
      'PATCH /api/meetings/[meetingId] - User authorized',
    );
    logger.info({ traceId, meetingId }, 'PATCH /api/meetings/[meetingId] - Updating meeting');

    const updateData: Record<string, unknown> = { ...req.body };
    if (req.body?.scheduledAt) {
      updateData.scheduledAt = new Date(req.body.scheduledAt);
    }

    const meeting = await updateMeeting({
      meetingId,
      associationId: association.id,
      data: updateData as Parameters<typeof updateMeeting>[0]['data'],
    });

    logger.info({ traceId, meetingId: meeting.id }, 'PATCH /api/meetings/[meetingId] - Success');
    return success(res, { data: meeting });
  }),
];
