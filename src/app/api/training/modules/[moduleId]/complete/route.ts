import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findManyCompletions, recordCompletion } from '@feature/training/services';
import { RecordCompletionSchema } from '@feature/training/validators/training';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const TrainingParamsSchema = z.object({
  moduleId: z.uuid('Invalid module ID'),
});
export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params, traceId }, req) => {
    if (!params) {
      throw new ForbiddenError('Invalid module ID');
    }

    logger.info(
      { traceId, associationId: association.id },
      'GET /training/modules/{moduleId}/complete - Request started',
    );

    const { moduleId } = params;
    await withRole(req, UserRole.MEMBER);
    logger.info({ traceId }, 'GET /training/modules/{moduleId}/complete - User authorized');

    const data = await findManyCompletions({
      associationId: association.id,
      moduleId,
    });

    logger.info({ traceId }, 'GET /training/modules/{moduleId}/complete - Success');
    return SuccessResponse({ data: data.completions, meta: data.pagination });
  },
);

export const POST = withAssociation(
  { params: TrainingParamsSchema, body: RecordCompletionSchema },
  async (association, { params, body, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError('Invalid module ID');
    }
    if (!body) {
      throw new ForbiddenError('Invalid request body');
    }

    logger.info(
      { traceId, associationId: association.id },
      'POST /training/modules/{moduleId}/complete - Request started',
    );

    const { moduleId } = params;

    const user = await withRole(request, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id },
      'POST /training/modules/{moduleId}/complete - User authorized',
    );

    const completion = await recordCompletion({
      associationId: association.id,
      userId: user.id,
      moduleId,
      data: body,
    });

    logger.info(
      { traceId, completionId: completion.id },
      'POST /training/modules/{moduleId}/complete - Success',
    );
    return SuccessResponse({ data: completion }, 201);
  },
);
