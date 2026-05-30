import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole, MeetingStatus } from '@prisma/client';
import { createMeeting, findManyMeetings } from '@src/features/meetings/services';
import {
  CreateMeetingSchema,
  MeetingQuerySchema,
} from '@src/features/meetings/validators/meetings';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** GET /api/meetings - List all meetings for the association. */
export const getMeetings: RequestHandler[] = [
  validate({ query: MeetingQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'GET /api/meetings - Request started');

    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, role: user.role },
      'GET /api/meetings - User authorized',
    );

    const query = req.query as { page?: number; type?: string; status?: string };
    if (!query) throw new ForbiddenError('Invalid query parameters');

    const userId = req.userId as string;
    const { page, type, status } = query;

    if (hasHighRoleAccess(user.role)) {
      const result = await findManyMeetings({
        role: user.role,
        associationId: association.id,
        filters: { type, status } as any,
        pagination: { page: page ?? 1 },
      });
      logger.info({ traceId, count: result.meetings.length }, 'GET /api/meetings - Success');
      return success(res, { data: result.meetings, meta: result.pagination });
    }

    const result = await findManyMeetings({
      role: user.role,
      userId,
      associationId: association.id,
      filters: { status: MeetingStatus.SCHEDULED } as any,
      pagination: { page: page ?? 1 },
    });
    logger.info({ traceId, count: result.meetings.length }, 'GET /api/meetings - Success');
    return success(res, { data: result.meetings, meta: result.pagination });
  }),
];
