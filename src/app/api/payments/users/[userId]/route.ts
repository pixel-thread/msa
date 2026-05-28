import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { logger } from "@src/shared/logger";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { NotFoundError, ValidationError } from "@src/shared/errors";
import { getUserContributionSummary } from "@src/features/payments/services/contribution.service";
import { pageNumberValidation } from "@src/shared/validators/common";
import { PAGE_SIZE } from "@src/shared/constants";
import { buildPagination } from "@src/shared/utils/build-pagination";

const UserPaymentsParamsSchema = z.object({
  userId: z.uuid("Invalid user ID"),
});
const UserPaymentsQuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { params: UserPaymentsParamsSchema, query: UserPaymentsQuerySchema },
  async (association, { params, query, traceId }, request) => {
    logger.info("GET /api/payments/users/[userId] - Request started", { traceId, userId: params?.userId });

    await withRole(request, UserRole.FINANCE);
    logger.info("GET /api/payments/users/[userId] - User authorized", { traceId });

    if (!params) {
      throw new ValidationError("Missing user ID parameter");
    }

    const { userId } = params as { userId: string };
    const page = query?.page || 1;

    const user = await prisma.user.findUnique({
      where: { id: userId, associationId: association.id },
      select: { id: true, name: true, email: true, membershipNumber: true },
    });

    if (!user) {
      throw new NotFoundError("User not found in this association");
    }

    logger.info("GET /api/payments/users/[userId] - Fetching transactions", { traceId, userId });

    const [transactions, total, summary] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where: { userId, associationId: association.id },
        include: {
          allocations: {
            include: {
              contributionPeriod: {
                select: {
                  year: true,
                  month: true,
                  expectedAmount: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: { paymentDate: "desc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.paymentTransaction.count({
        where: { userId, associationId: association.id },
      }),
      getUserContributionSummary(userId),
    ]);

    logger.info("GET /api/payments/users/[userId] - Success", { traceId, userId, count: transactions.length, total });

    return SuccessResponse({
      data: {
        user,
        transactions,
        summary,
      },
      meta: buildPagination(total, page),
    });
  },
);
