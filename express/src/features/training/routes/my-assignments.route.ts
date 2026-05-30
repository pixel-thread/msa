import { Request, NextFunction, Response } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { findUserAssignments, findUserCompletions } from '@src/features/training/services';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';

export const getMyAssignments = [
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'GET /training/my-assignments - Request started');
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'GET /training/my-assignments - User authorized');

    const page = parseInt(req.query.page as string) || undefined;
    const assignments = await findUserAssignments({ userId: user.id, associationId: association.id, page });

    logger.info({ traceId }, 'GET /training/my-assignments - Success');
    return success(res, { data: assignments.assignments, meta: assignments.pagination });
  },
];

export const getMyCompletions = [
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'GET /training/my-completions - Request started');
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'GET /training/my-completions - User authorized');

    const page = parseInt(req.query.page as string) || undefined;
    const completions = await findUserCompletions({ userId: user.id, associationId: association.id, page });

    logger.info({ traceId }, 'GET /training/my-completions - Success');
    return success(res, { data: completions.module, meta: completions.pagination });
  },
];
