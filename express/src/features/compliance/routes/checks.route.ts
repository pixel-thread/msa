import { Request, Response, NextFunction } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { ComplianceCheckQuerySchema, ComplianceCheckParamsSchema } from '@src/features/compliance/validators';
import { findManyComplianceChecks, findUniqueComplianceCheck } from '@src/features/compliance/services';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { NotFoundError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';

export const listChecks = [
  validate({ query: ComplianceCheckQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'GET /compliance/checks - Request started');
      const user = await withRole(req, UserRole.DPO);
      logger.info({ traceId, userId: user.id, roles: user.role }, 'GET /compliance/checks - User authorized');

      const query = req.query as unknown as Record<string, unknown>;
      const where: Record<string, unknown> = {};

      if (query.checkType) where.checkType = query.checkType;
      if (query.fromDate) {
        where.checkedAt = { ...((where.checkedAt as object) || {}), gte: new Date(query.fromDate as string) };
      }
      if (query.toDate) {
        where.checkedAt = { ...((where.checkedAt as object) || {}), lte: new Date(query.toDate as string) };
      }

      const page = (query.page as number) ?? 1;
      const { checks, total } = await findManyComplianceChecks({
        where: where as Parameters<typeof findManyComplianceChecks>[0]['where'],
        page,
      });

      logger.info({ traceId, count: checks.length }, 'GET /compliance/checks - Success');
      return success(res, { data: checks, meta: buildPagination(total, page) });
    } catch (e) { next(e); }
  },
];

export const getCheck = [
  validate({ params: ComplianceCheckParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id, checkId: req.params.checkId }, 'GET /compliance/checks/:checkId - Request started');
      const user = await withRole(req, UserRole.DPO);
      logger.info({ traceId, userId: user.id, roles: user.role }, 'GET /compliance/checks/:checkId - User authorized');

      const check = await findUniqueComplianceCheck({
        where: { id: req.params.checkId, associationId: association.id },
      });

      if (!check) throw new NotFoundError('Compliance check not found');

      logger.info({ traceId, checkId: req.params.checkId }, 'GET /compliance/checks/:checkId - Success');
      return success(res, { data: check });
    } catch (e) { next(e); }
  },
];
