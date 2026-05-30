import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { createMeeting } from '@src/features/meetings/services';
import { CreateMeetingSchema } from '@src/features/meetings/validators/meetings';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** POST /api/meetings - Create a new meeting with agenda items. */
export const postCreateMeeting: RequestHandler[] = [
  validate({ body: CreateMeetingSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'POST /api/meetings - Request started');

    const userId = req.userId as string;
    const user = await withRole(req, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError('Only secretary, president, or super admin can create meetings');
    }

    logger.info(
      { traceId, userId: user.id, role: user.role },
      'POST /api/meetings - User authorized',
    );
    logger.info({ traceId }, 'POST /api/meetings - Creating meeting');

    const meeting = await createMeeting({
      associationId: association.id,
      createdById: userId,
      data: {
        title: req.body.title,
        type: req.body.type,
        scheduledAt: new Date(req.body.scheduledAt),
        venue: req.body.venue,
        agendaItems: req.body.agendaItems?.map((item: any, idx: number) => ({
          ...item,
          order: item.order ?? idx + 1,
        })),
      },
    });

    logger.info({ traceId, meetingId: meeting.id }, 'POST /api/meetings - Success');
    return success(res, { data: meeting }, 201);
  }),
];
