import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { findUserCompletions } from '@feature/training/services';
import { pageNumberValidation } from '@src/shared/validators/common';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const TrainingCompletionQuerySchema = z.object({
  page: pageNumberValidation,
});
export const GET = withAssociation(
  { query: TrainingCompletionQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'GET /training/my-completions - Request started',
    );

    const user = await withRole(request, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'GET /training/my-completions - User authorized');

    const page = query?.page;

    const completions = await findUserCompletions({
      userId: user.id,
      associationId: association.id,
      page,
    });

    logger.info({ traceId }, 'GET /training/my-completions - Success');
    return SuccessResponse({
      data: completions.module,
      meta: completions.pagination,
    });
  },
);
