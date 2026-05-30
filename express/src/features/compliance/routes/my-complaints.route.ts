import { Request, Response, NextFunction } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ComplaintQuerySchema, ComplaintParamsSchema, CreateComplaintSchema } from '@src/features/compliance/validators';
import { findManyComplaints, findUniqueComplaint, createComplaint } from '@src/features/compliance/services';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { UnauthorizedError, NotFoundError, BadRequestError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getAssociation } from './_helpers';

export const listMyComplaints = [
  validate({ query: ComplaintQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const userId = req.headers['x-user-id'] as string;
    try {
      if (!userId) {
        logger.error({ traceId }, 'GET /compliance/my - Unauthorized (missing x-user-id)');
        throw new UnauthorizedError('Unauthorized');
      }

      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id, userId }, 'GET /compliance/my - Request started');

      const query = req.query as unknown as Record<string, unknown>;
      const where: Record<string, unknown> = { associationId: association.id, userId };

      if (query.status) where.status = query.status;
      if (query.priority) where.priority = query.priority;
      if (query.fromDate) {
        where.createdAt = { ...((where.createdAt as object) || {}), gte: new Date(query.fromDate as string) };
      }
      if (query.toDate) {
        where.createdAt = { ...((where.createdAt as object) || {}), lte: new Date(query.toDate as string) };
      }

      const page = (query.page as number) ?? 1;
      const { complaints, total } = await findManyComplaints({
        where: where as Parameters<typeof findManyComplaints>[0]['where'],
        page,
      });

      logger.info({ traceId, count: complaints.length }, 'GET /compliance/my - Success');
      return success(res, { data: complaints, meta: buildPagination(total, page) });
    } catch (e) { next(e); }
  },
];

export const createMyComplaint = [
  validate({ body: CreateComplaintSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const userId = req.headers['x-user-id'] as string;
    try {
      if (!userId) throw new UnauthorizedError('Unauthorized');

      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'POST /compliance/my - Request started');

      const complaint = await createComplaint({
        associationId: association.id,
        userId,
        data: req.body,
      });

      logger.info({ traceId, complaintId: complaint.id }, 'POST /compliance/my - Success');
      return success(res, { data: complaint }, 201);
    } catch (e) { next(e); }
  },
];

export const getMyComplaint = [
  validate({ params: ComplaintParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const userId = req.headers['x-user-id'] as string;
    try {
      if (!userId) {
        logger.error({ traceId }, 'GET /compliance/my/:complaintId - Unauthorized (missing x-user-id)');
        throw new UnauthorizedError('Unauthorized');
      }

      logger.info({ traceId, complaintId: req.params.complaintId }, 'GET /compliance/my/:complaintId - Request started');

      const association = await getAssociation(req);
      const complaint = await findUniqueComplaint({
        where: { id: req.params.complaintId, associationId: association.id, userId },
      });

      if (!complaint) throw new NotFoundError('Complaint not found');

      logger.info({ traceId, complaintId: req.params.complaintId }, 'GET /compliance/my/:complaintId - Success');
      return success(res, { data: complaint });
    } catch (e) { next(e); }
  },
];

export const updateMyComplaint = [
  validate({ params: ComplaintParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      logger.info({ traceId, complaintId: req.params.complaintId }, 'PUT /compliance/my/:complaintId - Not implemented');
      throw new BadRequestError('Update complaint not implemented yet');
    } catch (e) { next(e); }
  },
];
