import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { findManyMeetings } from '@src/features/meetings/services';
import { pageNumberValidation } from '@src/shared/validators/common';
import { logger } from '@src/shared/logger';
import { z } from 'zod';
import { getAssociation, withRole } from './_helpers';

const QuerySchema = z.object({
  page: pageNumberValidation,
});

export const getMyMeetings = [
  validate({ query: QuerySchema }),
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'GET /api/meetings/my - Request started');

    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id, role: user.role }, 'GET /api/meetings/my - User authorized');

    const userId = req.headers['x-user-id'] as string;
    const page = (req.query as any)?.page || 1;

    const { meetings, pagination } = await findManyMeetings({
      associationId: association.id,
      userId,
      role: user.role,
      pagination: { page },
    });

    logger.info({ traceId, count: meetings.length }, 'GET /api/meetings/my - Success');
    return success(res, { data: meetings, meta: pagination });
  },
];
