import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { ForbiddenError } from '@src/shared/errors';
import { findUniqueMeeting } from '@src/features/meetings/services/findUniqueMeeting';
import { createAgendaItem } from '@src/features/meetings/services/createAgendaItem';
import { countAgendaItems } from '@src/features/meetings/services/countAgendaItems';
import { CreateAgendaItemSchema } from '@src/features/meetings/validators/agenda-items';
import { logger } from '@src/shared/logger';
import { z } from 'zod';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

const ParamsSchema = z.object({ meetingId: z.string('Invalid meeting ID') });

/** POST /api/meetings/[meetingId]/agenda - Create a new agenda item for a meeting. */
export const postAddAgendaItem: RequestHandler[] = [
  validate({ params: ParamsSchema, body: CreateAgendaItemSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const meetingId = req.params.meetingId as string;
    logger.info({ traceId, meetingId }, 'POST /api/meetings/[meetingId]/agenda - Request started');

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, role: user.role, meetingId },
      'POST /api/meetings/[meetingId]/agenda - User authorized',
    );

    logger.info(
      { traceId, meetingId },
      'POST /api/meetings/[meetingId]/agenda - Creating agenda item',
    );

    let order = req.body.order;
    if (order === undefined) {
      const count = await countAgendaItems({ meetingId });
      order = count + 1;
    }

    const item = await createAgendaItem({
      meetingId,
      title: req.body.title,
      description: req.body.description,
      order,
    });

    logger.info(
      { traceId, meetingId, agendaItemId: item.id },
      'POST /api/meetings/[meetingId]/agenda - Success',
    );
    return success(res, { data: item, message: 'Agenda item created successfully' });
  }),
];
