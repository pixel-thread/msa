import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { findUniqueMeeting } from '@src/features/meetings/services';
import { logger } from '@src/shared/logger';
import { z } from 'zod';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

const ParamsSchema = z.object({ meetingId: z.string('Invalid meeting ID') });

/** GET /api/meetings/[meetingId]/agenda - List all agenda items for a meeting. */
export const getAgendaItems: RequestHandler[] = [
  validate({ params: ParamsSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const meetingId = req.params.meetingId as string;
    logger.info(
      { traceId, meetingId, associationId: association.id },
      'GET /api/meetings/[meetingId]/agenda - Request started',
    );

    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, role: user.role, meetingId },
      'GET /api/meetings/[meetingId]/agenda - User authorized',
    );

    const meeting = await findUniqueMeeting({ meetingId, associationId: association.id });
    const agenda = meeting.agendaItems;

    logger.info(
      { traceId, meetingId: meeting.id },
      'GET /api/meetings/[meetingId]/agenda - Success',
    );
    return success(res, { data: agenda });
  }),
];
