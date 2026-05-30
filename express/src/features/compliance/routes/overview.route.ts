import { Request, Response, NextFunction } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { ComplaintQuerySchema } from '@src/features/compliance/validators';
import { findManyComplaints } from '@src/features/compliance/services';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';

export const listComplaints = [
  validate({ query: ComplaintQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'GET /compliance - Request started');
      const user = await withRole(req, UserRole.DPO);
      logger.info({ traceId, userId: user.id, roles: user.role }, 'GET /compliance - User authorized');

      const query = req.query as unknown as Record<string, unknown>;
      const where: Record<string, unknown> = { associationId: association.id };

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

      logger.info({ traceId, count: complaints.length }, 'GET /compliance - Success');
      return success(res, { data: complaints, meta: buildPagination(total, page) });
    } catch (e) { next(e); }
  },
];
