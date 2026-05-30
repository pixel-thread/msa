import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { pageNumberValidation } from '@src/shared/validators/common';
import { z } from 'zod';
import { logger } from '@src/shared/logger';
import { getSubscriptionPayments } from '@feature/subscriptions/services';
import { getAssociation, withRole } from '@src/features/meetings/routes/_helpers';

const SubscriptionParamsSchema = z.object({
  subscriptionId: z.uuid('Invalid subscription ID'),
});

const SubscriptionQuerySchema = z.object({
  page: pageNumberValidation,
});

export const getSubscriptionPaymentsHandler: RequestHandler[] = [
  validate({ params: SubscriptionParamsSchema, query: SubscriptionQuerySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/subscriptions/[subscriptionId]/payments - Request started',
    );
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'User authorized');
    const page = (req.query as any)?.page || 1;
    const subscriptionId = req.params.subscriptionId;
    const result = await getSubscriptionPayments({
      subscriptionId,
      userId: user.id,
      role: user.role,
      associationId: association.id,
      page,
    });
    logger.info({ traceId, subscriptionId, count: result.data.length }, 'Payments fetched');
    return success(res, result);
  },
];
