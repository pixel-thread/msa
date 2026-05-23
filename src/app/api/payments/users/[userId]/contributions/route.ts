import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { NotFoundError, ValidationError } from "@src/shared/errors";
import { getUserContributionSummary } from "@src/features/payments/services/contribution.service";

const UserContributionsParamsSchema = z.object({
  userId: z.uuid("Invalid user ID"),
});
const UserContributionsQuerySchema = z.object({
  fromYear: z.coerce.number().int().min(2020).max(2100).optional(),
  fromMonth: z.coerce.number().int().min(1).max(12).optional(),
  toYear: z.coerce.number().int().min(2020).max(2100).optional(),
  toMonth: z.coerce.number().int().min(1).max(12).optional(),
});

export const GET = withAssociation(
  { params: UserContributionsParamsSchema, query: UserContributionsQuerySchema },
  async (association, { params, query }, request) => {
    await withRole(request, UserRole.FINANCE);

    if (!params) {
      throw new ValidationError("Missing user ID parameter");
    }

    const { userId } = params as { userId: string };
    const { fromYear, fromMonth, toYear, toMonth } = query as {
      fromYear?: number;
      fromMonth?: number;
      toYear?: number;
      toMonth?: number;
    } || {};

    const user = await prisma.user.findUnique({
      where: { id: userId, associationId: association.id },
      select: { id: true, name: true, email: true, membershipNumber: true },
    });

    if (!user) {
      throw new NotFoundError("User not found in this association");
    }

    const whereClause: Record<string, unknown> = {
      userId,
      associationId: association.id,
    };

    if (fromYear && fromMonth) {
      whereClause.AND = whereClause.AND ? [...(whereClause.AND as unknown[]), {
        OR: [
          { year: { gt: fromYear } },
          { year: fromYear, month: { gte: fromMonth } },
        ],
      }] : [{
        OR: [
          { year: { gt: fromYear } },
          { year: fromYear, month: { gte: fromMonth } },
        ],
      }];
    }

    if (toYear && toMonth) {
      const toClause = {
        OR: [
          { year: { lt: toYear } },
          { year: toYear, month: { lte: toMonth } },
        ],
      };
      whereClause.AND = whereClause.AND
        ? [...(whereClause.AND as unknown[]), toClause]
        : [toClause];
    }

    const [contributions, summary] = await Promise.all([
      prisma.contributionPeriod.findMany({
        where: whereClause,
        include: {
          allocations: {
            include: {
              paymentTransaction: {
                select: {
                  id: true,
                  amount: true,
                  method: true,
                  gateway: true,
                  status: true,
                  paidAt: true,
                  receiptNumber: true,
                },
              },
            },
          },
        },
        orderBy: [{ year: "asc" }, { month: "asc" }],
      }),
      getUserContributionSummary(userId),
    ]);

    return SuccessResponse({
      data: {
        user,
        contributions,
        summary,
      },
    });
  },
);
