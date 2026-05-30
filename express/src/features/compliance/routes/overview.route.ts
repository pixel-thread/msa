import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { ComplaintQuerySchema, CreateComplaintSchema } from '@src/features/compliance/validators';
import { findManyComplaints, createComplaint } from '@src/features/compliance/services';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';

export const listComplaints: RequestHandler[] = [
  validate({ query: ComplaintQuerySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'GET /compliance - Request started');
    const user = await withRole(req, UserRole.DPO);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /compliance - User authorized',
    );

    const query = req.query as unknown as Record<string, unknown>;
    const where: Record<string, unknown> = { associationId: association.id };

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

    logger.info({ traceId, count: complaints.length }, 'GET /compliance - Success');
    return success(res, { data: complaints, meta: buildPagination(total, page) });
  },
];

export const createComplaintHandler: RequestHandler[] = [
  validate({ body: CreateComplaintSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'POST /compliance - Request started');
    const user = await withRole(req, UserRole.DPO);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /compliance - User authorized',
    );

    const userId = req.userId as string;
    const complaint = await createComplaint({
      associationId: association.id,
      userId,
      data: req.body,
    });

    logger.info({ traceId, complaintId: complaint.id }, 'POST /compliance - Success');
    return success(res, { data: complaint }, 201);
  },
];
