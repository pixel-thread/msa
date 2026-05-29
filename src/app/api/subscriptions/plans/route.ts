import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { CreateSubscriptionPlanSchema } from '@feature/subscriptions/validators';
import { ValidationError } from '@src/shared/errors';
import { getTraceId } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';
import { getPlans, createPlan } from '@feature/subscriptions/services';

export const GET = withAssociation({}, async (association, { traceId }, request) => {
  const user = await withRole(request, UserRole.MEMBER);

  logger.info({ traceId, role: user.role }, 'GET /api/subscriptions/plans - Fetching plans');

  const data = await getPlans(association.id, user);

  return SuccessResponse({ data });
});

export const POST = withAssociation(
  { body: CreateSubscriptionPlanSchema },
  async (association, { body }, request) => {
    const traceId = getTraceId(request);
    await withRole(request, UserRole.SUPER_ADMIN);

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    logger.info({ traceId, name: body.name }, 'Creating new plan');

    const plan = await createPlan(association.id, body);

    return SuccessResponse({ data: plan }, 201);
  },
);
