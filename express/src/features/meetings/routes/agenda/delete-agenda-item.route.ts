import { Request, NextFunction, Response, RequestHandler } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { deleteAgendaItem } from '@src/features/meetings/services/deleteAgendaItem';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** DELETE /api/meetings/[meetingId]/agenda/[itemId] - Delete an agenda item. */
export const deleteAgendaItemHandler: RequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'DELETE /api/meetings/[meetingId]/agenda/[itemId] - Request started',
    );

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, role: user.role },
      'DELETE /api/meetings/[meetingId]/agenda/[itemId] - User authorized',
    );

    const itemId = req.params.itemId as string;
    logger.info(
      { traceId, itemId },
      'DELETE /api/meetings/[meetingId]/agenda/[itemId] - Deleting agenda item',
    );

    const item = await deleteAgendaItem({ where: { id: itemId } });

    logger.info({ traceId, itemId }, 'DELETE /api/meetings/[meetingId]/agenda/[itemId] - Success');
    return success(res, { data: item });
  },
);
