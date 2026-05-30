import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { updateAgendaItem } from '@src/features/meetings/services/updateAgendaItem';
import { z } from 'zod';
import { ValidationError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from '../_helpers';

const UpdateAgendaItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

export const patchUpdateAgendaItem = [
  validate({ body: UpdateAgendaItemSchema }),
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'PATCH /api/meetings/[meetingId]/agenda/[itemId] - Request started');

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info({ traceId, userId: user.id, role: user.role }, 'PATCH /api/meetings/[meetingId]/agenda/[itemId] - User authorized');

    const itemId = req.params.itemId as string;
    logger.info({ traceId, itemId }, 'PATCH /api/meetings/[meetingId]/agenda/[itemId] - Updating agenda item');

    const item = await updateAgendaItem({
      where: { id: itemId },
      data: req.body,
    });

    logger.info({ traceId, itemId }, 'PATCH /api/meetings/[meetingId]/agenda/[itemId] - Success');
    return success(res, { data: item });
  },
];
