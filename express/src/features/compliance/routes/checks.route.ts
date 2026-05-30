// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { NotFoundError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
import {
  UserRole,
  ComplianceCheckStatus as PrismaComplianceCheckStatus,
  Prisma,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
import {
  findManyComplianceChecks,
  findUniqueComplianceCheck,
  runComplianceCheck,
  createBulkComplianceChecks,
  deleteComplianceCheck,
} from '@src/features/compliance/services';

// ---------------------------------------------------------------------------
// Validators / Types
// ---------------------------------------------------------------------------
import {
  ComplianceCheckQuerySchema,
  ComplianceCheckParamsSchema,
  TriggerComplianceCheckSchema,
  ALL_CHECK_TYPES,
} from '@src/features/compliance/validators';

// ---------------------------------------------------------------------------
// GET /compliance/checks  —  List compliance checks
// Security: requires DPO role
// Business intent: let DPOs browse all compliance checks that have been run,
//   filtered by type or date range, to monitor organisational adherence.
// ---------------------------------------------------------------------------
export const listChecks: RequestHandler[] = [
  validate({ query: ComplianceCheckQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
    const association = await getAssociation(req);

    // ── Auth log ────────────────────────────────────────────────────────────
    logger.info(
      { traceId, associationId: association.id },
      'GET /compliance/checks - Request started',
    );

    const user = await withRole(req, UserRole.DPO);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /compliance/checks - User authorized',
    );

    // ── Business logic — build filters & fetch ──────────────────────────────
    const query = req.query as unknown as Record<string, unknown>;
    const where: Record<string, unknown> = {};

    if (query.checkType) where.checkType = query.checkType;
    if (query.fromDate) {
      where.checkedAt = {
        ...((where.checkedAt as object) || {}),
        gte: new Date(query.fromDate as string),
      };
    }
    if (query.toDate) {
      where.checkedAt = {
        ...((where.checkedAt as object) || {}),
        lte: new Date(query.toDate as string),
      };
    }

    const page = (query.page as number) ?? 1;
    const { checks, total } = await findManyComplianceChecks({
      where: where as Parameters<typeof findManyComplianceChecks>[0]['where'],
      page,
    });

    // ── Result log & response ───────────────────────────────────────────────
    logger.info({ traceId, count: checks.length }, 'GET /compliance/checks - Success');
    return success(res, { data: checks, meta: buildPagination(total, page) });
  }),
];

// ---------------------------------------------------------------------------
// GET /compliance/checks/:checkId  —  Fetch a single compliance check
// Security: requires DPO role
// Business intent: allow DPOs to read the full detail of a specific
//   compliance check result.
// ---------------------------------------------------------------------------
export const getCheck: RequestHandler[] = [
  validate({ params: ComplianceCheckParamsSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
    const association = await getAssociation(req);

    // ── Auth log ────────────────────────────────────────────────────────────
    logger.info(
      { traceId, associationId: association.id, checkId: req.params.checkId },
      'GET /compliance/checks/:checkId - Request started',
    );

    const user = await withRole(req, UserRole.DPO);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /compliance/checks/:checkId - User authorized',
    );

    // ── Business logic ──────────────────────────────────────────────────────
    const check = await findUniqueComplianceCheck({
      where: { id: req.params.checkId as string, associationId: association.id },
    });

    if (!check) throw new NotFoundError('Compliance check not found');

    // ── Result log & response ───────────────────────────────────────────────
    logger.info(
      { traceId, checkId: req.params.checkId },
      'GET /compliance/checks/:checkId - Success',
    );
    return success(res, { data: check });
  }),
];

// ---------------------------------------------------------------------------
// POST /compliance/checks  —  Trigger compliance checks
// Security: requires DPO role
// Business intent: allow DPOs to manually initiate a full or partial
//   compliance scan of the association and persist the results.
// ---------------------------------------------------------------------------
export const runChecks: RequestHandler[] = [
  validate({ body: TriggerComplianceCheckSchema.optional() }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
    const association = await getAssociation(req);

    // ── Auth log ────────────────────────────────────────────────────────────
    logger.info(
      { traceId, associationId: association.id },
      'POST /compliance/checks - Request started',
    );

    const user = await withRole(req, UserRole.DPO);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /compliance/checks - User authorized',
    );

    // ── Business logic — determine which checks to run ──────────────────────
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

    // ── Result log & response ───────────────────────────────────────────────
    logger.info({ traceId, count: results.length }, 'POST /compliance/checks - Success');
    return success(res, { data: results }, 201);
  }),
];

// ---------------------------------------------------------------------------
// DELETE /compliance/checks/:checkId  —  Delete a compliance check record
// Security: requires DPO role
// Business intent: allow DPOs to clean up obsolete or duplicate check
//   entries from the compliance history.
// ---------------------------------------------------------------------------
export const deleteCheck: RequestHandler[] = [
  validate({ params: ComplianceCheckParamsSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
    const association = await getAssociation(req);

    // ── Auth log ────────────────────────────────────────────────────────────
    logger.info(
      { traceId, associationId: association.id, checkId: req.params.checkId },
      'DELETE /compliance/checks/:checkId - Request started',
    );

    const user = await withRole(req, UserRole.DPO);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'DELETE /compliance/checks/:checkId - User authorized',
    );

    // ── Business logic — verify existence & delete ──────────────────────────
    const existing = await findUniqueComplianceCheck({
      where: { id: req.params.checkId as string, associationId: association.id },
    });
    if (!existing) throw new NotFoundError('Compliance check not found');

    await deleteComplianceCheck({ where: { id: req.params.checkId as string } });

    // ── Result log & response ───────────────────────────────────────────────
    logger.info(
      { traceId, checkId: req.params.checkId },
      'DELETE /compliance/checks/:checkId - Success',
    );
    return success(res, { data: null, message: 'Compliance check deleted successfully' });
  }),
];
