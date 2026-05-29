import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { ValidationError } from '@src/shared/errors';
import { getTraceId } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';
import { setDefaultPlan } from '@feature/subscriptions/services';

const SetDefaultPlanSchema = z.object({
  planId: z.uuid(),
});

export const POST = withAssociation(
  { body: SetDefaultPlanSchema },
  async (association, { body }, request) => {
    const traceId = getTraceId(request);
    await withRole(request, UserRole.SUPER_ADMIN);

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    logger.info({ traceId, planId: body.planId }, 'Setting plan as default');

    const updated = await setDefaultPlan(association.id, body.planId);

    return SuccessResponse({ data: updated });
  },
);
