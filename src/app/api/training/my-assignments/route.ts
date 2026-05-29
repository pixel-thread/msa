import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { findUserAssignments } from '@feature/training/services';
import { pageNumberValidation } from '@src/shared/validators/common';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const TrainingAssignmentQuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: TrainingAssignmentQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'GET /training/my-assignments - Request started',
    );

    const user = await withRole(request, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'GET /training/my-assignments - User authorized');

    const page = query?.page;

    const assignments = await findUserAssignments({
      userId: user.id,
      associationId: association.id,
      page,
    });

    logger.info({ traceId }, 'GET /training/my-assignments - Success');
    return SuccessResponse({
      data: assignments.assignments,
      meta: assignments.pagination,
    });
  },
);
