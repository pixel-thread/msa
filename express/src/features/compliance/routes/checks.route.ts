import { Request, Response, NextFunction } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole, ComplianceCheckStatus as PrismaComplianceCheckStatus, Prisma } from '@prisma/client';
import { ComplianceCheckQuerySchema, ComplianceCheckParamsSchema, TriggerComplianceCheckSchema, ALL_CHECK_TYPES } from '@src/features/compliance/validators';
import { findManyComplianceChecks, findUniqueComplianceCheck, runComplianceCheck, createBulkComplianceChecks, deleteComplianceCheck } from '@src/features/compliance/services';
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

export const runChecks = [
  validate({ body: TriggerComplianceCheckSchema.optional() }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'POST /compliance/checks - Request started');
      const user = await withRole(req, UserRole.DPO);
      logger.info({ traceId, userId: user.id, roles: user.role }, 'POST /compliance/checks - User authorized');

      let checkTypes: string[] = ALL_CHECK_TYPES;
      if (req.body?.checkTypes && Array.isArray(req.body.checkTypes)) {
        const validTypes = req.body.checkTypes.filter((t: string) => ALL_CHECK_TYPES.includes(t));
        if (validTypes.length > 0) {
          checkTypes = validTypes;
        }
      }

      const results = await Promise.all(
        checkTypes.map((type) => runComplianceCheck(association.id, type)),
      );

      const checksData: Prisma.ComplianceCheckCreateManyArgs['data'][] = results.map((result) => ({
        associationId: association.id,
        checkType: result.checkType,
        status: result.status as PrismaComplianceCheckStatus,
        score: result.score,
        message: result.message,
        details: result.details as Prisma.InputJsonValue,
        recommendations: result.recommendations as Prisma.InputJsonValue,
      }));

      await createBulkComplianceChecks({
        data: checksData as Parameters<typeof createBulkComplianceChecks>[0]['data'],
      });

      logger.info({ traceId, count: results.length }, 'POST /compliance/checks - Success');
      return success(res, { data: results }, 201);
    } catch (e) { next(e); }
  },
];

export const deleteCheck = [
  validate({ params: ComplianceCheckParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id, checkId: req.params.checkId }, 'DELETE /compliance/checks/:checkId - Request started');
      const user = await withRole(req, UserRole.DPO);
      logger.info({ traceId, userId: user.id, roles: user.role }, 'DELETE /compliance/checks/:checkId - User authorized');

      const existing = await findUniqueComplianceCheck({
        where: { id: req.params.checkId, associationId: association.id },
      });
      if (!existing) throw new NotFoundError('Compliance check not found');

      await deleteComplianceCheck({ where: { id: req.params.checkId } });

      logger.info({ traceId, checkId: req.params.checkId }, 'DELETE /compliance/checks/:checkId - Success');
      return success(res, { data: null, message: 'Compliance check deleted successfully' });
    } catch (e) { next(e); }
  },
];