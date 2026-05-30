import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { pageNumberValidation } from '@src/shared/validators/common';
import { logger } from '@src/shared/logger';
import { getMySubscription } from '@feature/subscriptions/services';
import { getAssociation, withRole } from '@src/features/meetings/routes/_helpers';

const MySubscriptionQuerySchema = z.object({
  page: pageNumberValidation,
});

export const getMySubscriptionHandler = [
  validate({ query: MySubscriptionQuerySchema }),
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'GET /api/subscriptions/my - Request started');
    const page = (req.query as any)?.page || 1;
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'User authorized');
    const result = await getMySubscription(user.id, page);
    return success(res, result);
  },
];
