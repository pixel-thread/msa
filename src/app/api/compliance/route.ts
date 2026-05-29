import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { UserRole } from '@prisma/client';
import { ComplaintQuerySchema, CreateComplaintSchema } from '@src/features/compliance/validators';
import { createComplaint, findManyComplaints } from '@src/features/compliance/services';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation(
  { query: ComplaintQuerySchema },
  async (association, { query, traceId }, req) => {
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/compliance - Request started',
    );
    const user = await withRole(req, UserRole.DPO);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/compliance - User authorized',
    );

    const where: Record<string, unknown> = {
      associationId: association.id,
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

    logger.info({ traceId, count: complaints.length }, 'GET /api/compliance - Success');

    return SuccessResponse({
      data: complaints,
      meta: buildPagination(total, query?.page ?? 1),
    });
  },
);

export const POST = withAssociation(
  { body: CreateComplaintSchema },
  async (association, { body, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/compliance - Request started',
    );
    const userId = request.headers.get('x-user-id')!;

    const complaint = await createComplaint({
      associationId: association.id,
      userId,
      data: body!,
    });

    logger.info({ traceId, complaintId: complaint.id }, 'POST /api/compliance - Success');

    return SuccessResponse({ data: complaint }, 201);
  },
);
