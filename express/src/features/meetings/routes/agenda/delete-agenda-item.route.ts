import { Request, Response, NextFunction } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { deleteAgendaItem } from '@src/features/meetings/services/deleteAgendaItem';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from '../_helpers';

export const deleteAgendaItemHandler = async (req: Request, res: Response) => {
  const traceId = (req.headers['x-trace-id'] as string) || '';
  try {
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'DELETE /api/meetings/[meetingId]/agenda/[itemId] - Request started');

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info({ traceId, userId: user.id, role: user.role }, 'DELETE /api/meetings/[meetingId]/agenda/[itemId] - User authorized');

    const itemId = req.params.itemId as string;
    logger.info({ traceId, itemId }, 'DELETE /api/meetings/[meetingId]/agenda/[itemId] - Deleting agenda item');

    const item = await deleteAgendaItem({ where: { id: itemId } });

    logger.info({ traceId, itemId }, 'DELETE /api/meetings/[meetingId]/agenda/[itemId] - Success');
    return success(res, { data: item });
  } catch (e) { next(e); }
};
