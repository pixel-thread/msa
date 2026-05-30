import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ComplaintQuerySchema, ComplaintParamsSchema } from '@src/features/compliance/validators';
import { findManyComplaints, findUniqueComplaint } from '@src/features/compliance/services';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { UnauthorizedError, NotFoundError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';

export const listMyComplaints: RequestHandler[] = [
  validate({ query: ComplaintQuerySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const userId = req.userId as string;
    if (!userId) {
      logger.error({ traceId }, 'GET /compliance/my - Unauthorized (missing x-user-id)');
      throw new UnauthorizedError('Unauthorized');
    }

    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id, userId },
      'GET /compliance/my - Request started',
    );

    const query = req.query as unknown as Record<string, unknown>;
    const where: Record<string, unknown> = { associationId: association.id, userId };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.fromDate) {
      where.createdAt = {
        ...((where.createdAt as object) || {}),
        gte: new Date(query.fromDate as string),
      };
    }
    if (query.toDate) {
      where.createdAt = {
        ...((where.createdAt as object) || {}),
        lte: new Date(query.toDate as string),
      };
    }

    const page = (query.page as number) ?? 1;
    const { complaints, total } = await findManyComplaints({
      where: where as Parameters<typeof findManyComplaints>[0]['where'],
      page,
    });

    logger.info({ traceId, count: complaints.length }, 'GET /compliance/my - Success');
    return success(res, { data: complaints, meta: buildPagination(total, page) });
  },
];

export const getMyComplaint: RequestHandler[] = [
  validate({ params: ComplaintParamsSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const userId = req.userId as string;
    if (!userId) {
      logger.error(
        { traceId },
        'GET /compliance/my/:complaintId - Unauthorized (missing x-user-id)',
      );
      throw new UnauthorizedError('Unauthorized');
    }

    logger.info(
      { traceId, complaintId: req.params.complaintId },
      'GET /compliance/my/:complaintId - Request started',
    );

    const association = await getAssociation(req);
    const complaint = await findUniqueComplaint({
      where: { id: req.params.complaintId as string, associationId: association.id, userId },
    });

    if (!complaint) throw new NotFoundError('Complaint not found');

    logger.info(
      { traceId, complaintId: req.params.complaintId },
      'GET /compliance/my/:complaintId - Success',
    );
    return success(res, { data: complaint });
  },
];
