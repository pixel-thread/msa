import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { pageNumberValidation } from '@src/shared/validators/common';
import { logger } from '@src/shared/logger';
import { getMySubscription } from '@feature/subscriptions/services';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';

/** Schema for paginated my-subscription query. */
const MySubscriptionQuerySchema = z.object({
  page: pageNumberValidation,
});

/** GET /api/subscriptions/my - Retrieve the current user's subscriptions. */
export const getMySubscriptionHandler: RequestHandler[] = [
  validate({ query: MySubscriptionQuerySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/subscriptions/my - Request started',
    );
    const page = (req.query as any)?.page || 1;
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'User authorized');
    const result = await getMySubscription(user.id, page);
    return success(res, result);
  },
];
