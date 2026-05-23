import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { UserRole, ContributionStatus } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import {
  GenerateContributionsSchema,
  WaiveContributionSchema,
} from "@feature/payments/validators";
import {
  generateMonthlyContributions,
  markOverdueContributions,
  waiveContribution,
} from "@feature/payments/services/contribution.service";
import { z } from "zod";
import { ValidationError } from "@src/shared/errors";
import { pageNumberValidation } from "@src/shared/validators/common";
import { PAGE_SIZE } from "@src/shared/constants";
import { buildPagination } from "@src/shared/utils/build-pagination";

const ContributionsQuerySchema = z.object({
  page: pageNumberValidation,
  status: z.enum(Object.values(ContributionStatus) as [string, ...string[]]).optional(),
  userId: z.uuid().optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

/**
 * GET /api/payments/contributions
 *
 * List all contribution periods with filtering and pagination.
 *
 * Requires: FINANCE role or higher.
 */
export const GET = withAssociation(
  { query: ContributionsQuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.FINANCE);

    if (!query) {
      throw new ValidationError("Invalid query parameters");
    }

    const page = query.page || 1;
    const { status, userId, year, month } = query as {
      page: number;
      status?: ContributionStatus;
      userId?: string;
      year?: number;
      month?: number;
    };

    const where: Record<string, unknown> = {
      associationId: association.id,
    };

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (year) where.year = year;
    if (month) where.month = month;

    const [contributions, total] = await prisma.$transaction([
      prisma.contributionPeriod.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              membershipNumber: true,
            },
          },
          allocations: {
            include: {
              paymentTransaction: {
                select: {
                  id: true,
                  amount: true,
                  method: true,
                  status: true,
                  paidAt: true,
                  receiptNumber: true,
                },
              },
            },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.contributionPeriod.count({ where }),
    ]);

    return SuccessResponse({
      data: contributions,
      meta: buildPagination(total, page),
    });
  },
);

/**
 * POST /api/payments/contributions
 *
 * Generate monthly contribution period rows for all active members.
 * This can be called manually by an admin or triggered by a cron job.
 *
 * Idempotent — duplicate rows are skipped.
 *
 * Requires: FINANCE role or higher.
 */
export const POST = withAssociation(
  { body: GenerateContributionsSchema },
  async (association, { body }, request) => {
    await withRole(request, UserRole.FINANCE);

    const count = await generateMonthlyContributions(
      association.id,
      body!.year,
      body!.month,
    );

    // Also mark overdue contributions while we're at it
    const overdueCount = await markOverdueContributions(association.id);

    return SuccessResponse(
      {
        data: {
          generated: count,
          markedOverdue: overdueCount,
        },
        message: `Generated ${count} contribution records, marked ${overdueCount} as overdue`,
      },
      201,
    );
  },
);

/**
 * PATCH /api/payments/contributions
 *
 * Waive a contribution period for a member.
 *
 * Requires: FINANCE role or higher.
 */
export const PATCH = withAssociation(
  { body: WaiveContributionSchema },
  async (_association, { body }, request) => {
    await withRole(request, UserRole.FINANCE);

    const waived = await waiveContribution(
      body!.contributionPeriodId,
      body!.reason,
    );

    return SuccessResponse(
      {
        data: waived,
        message: "Contribution period waived successfully",
      },
      200,
    );
  },
);
