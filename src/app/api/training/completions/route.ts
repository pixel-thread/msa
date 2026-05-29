import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findManyCompletions, adminRecordCompletion } from '@feature/training/services';
import { AdminRecordCompletionSchema } from '@feature/training/validators/training';
import { pageNumberValidation } from '@src/shared/validators/common';
import z from 'zod';
import { logger } from '@src/shared/logger/server';

const GetAllCompletionsQuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: GetAllCompletionsQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'GET /training/completions - Request started',
    );

    await withRole(request, UserRole.SECRETARY);
    logger.info({ traceId }, 'GET /training/completions - User authorized');

    const page = query?.page || 1;

    const { searchParams } = new URL(request.url);

    const moduleId = searchParams.get('moduleId') || undefined;

    const userId = searchParams.get('userId') || undefined;

    const data = await findManyCompletions({
      associationId: association.id,
      moduleId,
      userId,
      page,
    });

    logger.info({ traceId }, 'GET /training/completions - Success');
    return SuccessResponse({
      data: data.completions,
      meta: data.pagination,
    });
  },
);

export const POST = withAssociation(
  { body: AdminRecordCompletionSchema },
  async (association, { body, traceId }, request) => {
    if (!body) {
      throw new ForbiddenError('Invalid request body');
    }

    logger.info(
      { traceId, associationId: association.id },
      'POST /training/completions - Request started',
    );

    const admin = await withRole(request, UserRole.SECRETARY);
    logger.info({ traceId, userId: admin.id }, 'POST /training/completions - User authorized');

    const completion = await adminRecordCompletion({
      associationId: association.id,
      actorId: admin.id,
      data: body,
    });

    logger.info({ traceId, completionId: completion.id }, 'POST /training/completions - Success');
    return SuccessResponse({ data: completion }, 201);
  },
);
