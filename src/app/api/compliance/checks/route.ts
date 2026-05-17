import { withAssociation } from "@src/shared/api/with-association";
import {
  UserRole,
  ComplianceCheckStatus as PrismaComplianceCheckStatus,
  Prisma,
} from "@prisma/client";
import { runComplianceCheck } from "@src/features/complaince/services";
import {
  ComplianceCheckQuerySchema,
  ALL_CHECK_TYPES,
} from "@src/features/complaince/validators";
import { prisma } from "@src/shared/lib/prisma";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils";
import { buildPagination } from "@src/shared/utils/build-pagination";

const DPO_ROLE: UserRole = UserRole.DPO;

export const GET = withAssociation(
  { query: ComplianceCheckQuerySchema },
  async (_association, { query }, req) => {
    withRole(req, DPO_ROLE);

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
      skip: ((query?.page ?? 1) - 1) * (query?.limit ?? 20),
      take: query?.limit ?? 20,
    });

    const total = await prisma.complianceCheck.count({ where });

    return SuccessResponse({
      data: checks,
      meta: buildPagination(total, query?.page ?? 1, query?.limit ?? 20),
    });
  },
);

export const POST = withAssociation(
  {},
  async (association, _validated, request) => {
    await withRole(request, DPO_ROLE);

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

    return SuccessResponse({ data: results }, 201);
  },
);
