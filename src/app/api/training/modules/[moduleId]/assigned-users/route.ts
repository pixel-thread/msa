import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { buildPagination } from '@src/shared/utils';
import { ForbiddenError, BadRequestError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { getAssignedUsers, completeAssignment } from '@feature/training/services';
import { pageNumberValidation } from '@src/shared/validators';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const TrainingParamsSchema = z.object({
  moduleId: z.uuid('Invalid module ID'),
});

const TrainingQuerySchema = z.object({
  page: pageNumberValidation,
});

const CompleteAssignmentSchema = z.object({
  scorePercent: z.number().min(0).max(100).optional(),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema, query: TrainingQuerySchema },
  async (association, { params, query, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError('Invalid module ID');
    }

    logger.info(
      { traceId, associationId: association.id },
      'GET /training/modules/{moduleId}/assigned-users - Request started',
    );

    await withRole(request, UserRole.SECRETARY);
    logger.info({ traceId }, 'GET /training/modules/{moduleId}/assigned-users - User authorized');

    const { moduleId } = params;
    const page = query?.page || 1;

    const result = await getAssignedUsers({
      associationId: association.id,
      moduleId,
      page,
    });

    logger.info({ traceId }, 'GET /training/modules/{moduleId}/assigned-users - Success');
    return SuccessResponse({
      data: result.data,
      meta: buildPagination(result.total, page),
    });
  },
);
