import { withAssociation, withRole } from "@src/shared/api";
import {
  UserRole,
  ComplianceCheckStatus as PrismaComplianceCheckStatus,
  Prisma,
} from "@prisma/client";
import { runComplianceCheck } from "@src/features/compliance/services";
import {
  ComplianceCheckQuerySchema,
  ALL_CHECK_TYPES,
} from "@src/features/compliance/validators";
import { prisma } from "@src/shared/lib/prisma";
import { SuccessResponse } from "@src/shared/utils";
import { PAGE_SIZE } from "@src/shared/constants";
import { buildPagination } from "@src/shared/utils/build-pagination";
import { logger } from "@src/shared/logger";

const DPO_ROLE: UserRole = UserRole.DPO;

export const GET = withAssociation(
  { query: ComplianceCheckQuerySchema },
  async (association, { query, traceId }, req) => {
    logger.info("GET /api/compliance/checks - Request started", { traceId, associationId: association.id });
    const user = await withRole(req, DPO_ROLE);
    logger.info("GET /api/compliance/checks - User authorized", { traceId, userId: user.id, roles: user.role });

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

    const checks = await prisma.complianceCheck.findMany({
      where,
      orderBy: { checkedAt: "desc" },
      skip: ((query?.page ?? 1) - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    const total = await prisma.complianceCheck.count({ where });

    logger.info("GET /api/compliance/checks - Success", { traceId, count: checks.length });

    return SuccessResponse({
      data: checks,
      meta: buildPagination(total, query?.page ?? 1),
    });
  },
);

export const POST = withAssociation(
  {},
  async (association, { traceId }, request) => {
    logger.info("POST /api/compliance/checks - Request started", { traceId, associationId: association.id });
    const user = await withRole(request, DPO_ROLE);
    logger.info("POST /api/compliance/checks - User authorized", { traceId, userId: user.id, roles: user.role });

    let checkTypes: string[] = ALL_CHECK_TYPES;
    const body = await request.json().catch(() => ({}));

    if (body.checkTypes && Array.isArray(body.checkTypes)) {
      const validTypes = body.checkTypes.filter((t: string) =>
        ALL_CHECK_TYPES.includes(t),
      );
      if (validTypes.length > 0) {
        checkTypes = validTypes;
      }
    }

    const results = await Promise.all(
      checkTypes.map((type) => runComplianceCheck(association.id, type)),
    );

    const checksData: Prisma.ComplianceCheckCreateManyArgs["data"][] =
      results.map((result) => ({
        associationId: association.id,
        checkType: result.checkType,
        status: result.status as PrismaComplianceCheckStatus,
        score: result.score,
        message: result.message,
        details: result.details as Prisma.InputJsonValue,
        recommendations: result.recommendations as Prisma.InputJsonValue,
      }));

    await prisma.complianceCheck.createMany({
      data: checksData as Prisma.ComplianceCheckCreateManyArgs["data"],
    });

    logger.info("POST /api/compliance/checks - Success", { traceId, count: results.length });

    return SuccessResponse({ data: results }, 201);
  },
);
