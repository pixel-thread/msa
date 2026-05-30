import { Request, NextFunction, Response, RequestHandler } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { deleteMeetingMinute } from '@src/features/meetings/services/minutes';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** DELETE /api/meetings/[meetingId]/minutes/[minutesId] - Delete a meeting minute. */
export const deleteMinute: RequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const meetingId = req.params.meetingId as string;
    const minutesId = req.params.minutesId as string;
    logger.info(
      { traceId, meetingId, minutesId, associationId: association.id },
      'DELETE /api/meetings/[meetingId]/minutes/[minutesId] - Request started',
    );

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, role: user.role, meetingId, minutesId },
      'DELETE /api/meetings/[meetingId]/minutes/[minutesId] - User authorized',
    );
    logger.info(
      { traceId, meetingId, minutesId },
      'DELETE /api/meetings/[meetingId]/minutes/[minutesId] - Deleting meeting minute',
    );

    const deletedMinute = await deleteMeetingMinute({
      where: { id: minutesId, meetingId },
    });

    logger.info(
      { traceId, meetingId, minutesId },
      'DELETE /api/meetings/[meetingId]/minutes/[minutesId] - Success',
    );
    return success(res, { data: deletedMinute, message: 'Meeting minute deleted successfully' });
  },
);
