import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { updateAgendaItem } from '@src/features/meetings/services/updateAgendaItem';
import { z } from 'zod';
import { ValidationError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

const UpdateAgendaItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

/** PATCH /api/meetings/[meetingId]/agenda/[itemId] - Update an agenda item. */
export const patchUpdateAgendaItem: RequestHandler[] = [
  validate({ body: UpdateAgendaItemSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'PATCH /api/meetings/[meetingId]/agenda/[itemId] - Request started',
    );

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, role: user.role },
      'PATCH /api/meetings/[meetingId]/agenda/[itemId] - User authorized',
    );

    const itemId = req.params.itemId as string;
    logger.info(
      { traceId, itemId },
      'PATCH /api/meetings/[meetingId]/agenda/[itemId] - Updating agenda item',
    );

    const item = await updateAgendaItem({
      where: { id: itemId },
      data: req.body,
    });

    logger.info({ traceId, itemId }, 'PATCH /api/meetings/[meetingId]/agenda/[itemId] - Success');
    return success(res, { data: item });
  }),
];
