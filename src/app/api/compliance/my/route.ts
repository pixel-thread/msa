import { withAssociation } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { UnauthorizedError } from '@src/shared/errors';
import { ComplaintQuerySchema } from '@src/features/compliance/validators';
import { findManyComplaints } from '@src/features/compliance/services';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation(
  { query: ComplaintQuerySchema },
  async (association, { query, traceId }, req) => {
    const userId = req.headers.get('x-user-id');
    logger.info(
      { traceId, associationId: association.id, userId },
      'GET /api/compliance/my - Request started',
    );

    if (!userId) {
      logger.error({ traceId }, 'GET /api/compliance/my - Unauthorized (missing x-user-id)');
      throw new UnauthorizedError('Unauthorized');
    }

    const where: Record<string, unknown> = {
      associationId: association.id,
      userId,
    };

    if (query?.status) {
      where.status = query.status;
    }
    if (query?.priority) {
      where.priority = query.priority;
    }
    if (query?.fromDate) {
      where.createdAt = {
        ...((where.createdAt as object) || {}),
        gte: new Date(query.fromDate),
      };
    }
    if (query?.toDate) {
      where.createdAt = {
        ...((where.createdAt as object) || {}),
        lte: new Date(query.toDate),
      };
    }

    const { complaints, total } = await findManyComplaints({
      where: where as Parameters<typeof findManyComplaints>[0]['where'],
      page: query?.page ?? 1,
    });

    logger.info({ traceId, count: complaints.length }, 'GET /api/compliance/my - Success');

    return SuccessResponse({
      data: complaints,
      meta: buildPagination(total, query?.page ?? 1),
    });
  },
);
