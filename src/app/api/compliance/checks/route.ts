import { withAssociation, withRole } from '@src/shared/api';
import {
  UserRole,
  ComplianceCheckStatus as PrismaComplianceCheckStatus,
  Prisma,
} from '@prisma/client';
import { runComplianceCheck, findManyComplianceChecks, createBulkComplianceChecks } from '@src/features/compliance/services';
import { ComplianceCheckQuerySchema, ALL_CHECK_TYPES } from '@src/features/compliance/validators';
import { SuccessResponse } from '@src/shared/utils';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { logger } from '@src/shared/logger/server';

const DPO_ROLE: UserRole = UserRole.DPO;

export const GET = withAssociation(
  { query: ComplianceCheckQuerySchema },
  async (association, { query, traceId }, req) => {
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/compliance/checks - Request started',
    );
    const user = await withRole(req, DPO_ROLE);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/compliance/checks - User authorized',
    );

    const where: Record<string, unknown> = {};

    if (query?.checkType) {
      where.checkType = query.checkType;
    }
    if (query?.fromDate) {
      where.checkedAt = {
        ...((where.checkedAt as object) || {}),
        gte: new Date(query.fromDate),
      };
    }
    if (query?.toDate) {
      where.checkedAt = {
        ...((where.checkedAt as object) || {}),
        lte: new Date(query.toDate),
      };
    }

    const { checks, total } = await findManyComplianceChecks({
      where: where as Parameters<typeof findManyComplianceChecks>[0]['where'],
      page: query?.page ?? 1,
    });

    logger.info({ traceId, count: checks.length }, 'GET /api/compliance/checks - Success');

    return SuccessResponse({
      data: checks,
      meta: buildPagination(total, query?.page ?? 1),
    });
  },
);

export const POST = withAssociation({}, async (association, { traceId }, request) => {
  logger.info(
    { traceId, associationId: association.id },
    'POST /api/compliance/checks - Request started',
  );
  const user = await withRole(request, DPO_ROLE);
  logger.info(
    { traceId, userId: user.id, roles: user.role },
    'POST /api/compliance/checks - User authorized',
  );

  let checkTypes: string[] = ALL_CHECK_TYPES;
  const body = await request.json().catch(() => ({}));

  if (body.checkTypes && Array.isArray(body.checkTypes)) {
    const validTypes = body.checkTypes.filter((t: string) => ALL_CHECK_TYPES.includes(t));
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

  logger.info({ traceId, count: results.length }, 'POST /api/compliance/checks - Success');

  return SuccessResponse({ data: results }, 201);
});
