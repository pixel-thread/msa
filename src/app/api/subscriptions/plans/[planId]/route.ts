import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { ValidationError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';
import { updatePlan, softDeletePlan } from '@feature/subscriptions/services';

const UpdatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
  features: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
  memberTypeId: z.uuid().optional().nullable(),
});

export const PATCH = withAssociation(
  { body: UpdatePlanSchema },
  async (association, { body, traceId }, request, { params }) => {
    logger.info(
      { traceId, associationId: association.id },
      'PATCH /api/subscriptions/plans/[planId] - Request started',
    );

    const user = await withRole(request, UserRole.SUPER_ADMIN);

    logger.info({ traceId, userId: user.id }, 'User authorized');

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const { planId } = (await params) as { planId: string };

    const updatedPlan = await updatePlan(association.id, planId, body);

    logger.info({ traceId, planId }, 'Plan updated successfully');

    return SuccessResponse({ data: updatedPlan });
  },
);

export const DELETE = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info(
    { traceId, associationId: association.id },
    'DELETE /api/subscriptions/plans/[planId] - Request started',
  );

  const user = await withRole(request, UserRole.PRESIDENT);

  logger.info({ traceId, userId: user.id }, 'User authorized');

  const { planId } = (await params) as { planId: string };

  const plan = await softDeletePlan(association.id, planId);

  logger.info({ traceId, planId }, 'Plan deleted successfully');

  return SuccessResponse({
    data: plan,
    message: 'Plan deleted successfully',
  });
});
