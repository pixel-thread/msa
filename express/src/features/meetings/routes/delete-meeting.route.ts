import { Request, NextFunction, Response } from 'express';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { deleteMeeting } from '@src/features/meetings/services';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';

export const deleteMeetingHandler = async (req: Request, res: Response, _next?: NextFunction) => {
  const traceId = (req.headers['x-trace-id'] as string) || '';
  const association = await getAssociation(req);
  const meetingId = req.params.meetingId as string;
  logger.info({ traceId, meetingId, associationId: association.id }, 'DELETE /api/meetings/[meetingId] - Request started');

  const user = await withRole(req, UserRole.SECRETARY);
  if (!hasHighRoleAccess(user.role)) {
    throw new ForbiddenError('Only secretary, president, or super admin can delete meetings');
  }

  logger.info({ traceId, userId: user.id, role: user.role, meetingId }, 'DELETE /api/meetings/[meetingId] - User authorized');
  logger.info({ traceId, meetingId }, 'DELETE /api/meetings/[meetingId] - Deleting meeting');

  const deletedMeeting = await deleteMeeting({ meetingId, associationId: association.id });

  logger.info({ traceId, meetingId: deletedMeeting.id }, 'DELETE /api/meetings/[meetingId] - Success');
  return success(res, { data: deletedMeeting, message: 'Meeting deleted successfully' });
};
