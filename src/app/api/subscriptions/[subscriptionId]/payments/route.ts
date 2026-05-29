import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { hasHighRoleAccess } from "@src/shared/utils/has-high-role";
import { ForbiddenError } from "@src/shared/errors";
import { pageNumberValidation } from "@src/shared/validators/common";
import z from "zod";
import { PAGE_SIZE } from "@src/shared/constants";
import { buildPagination } from "@src/shared/utils/build-pagination";
import { logger } from "@src/shared/logger/server";

const SubscriptionParamsSchema = z.object({
  subscriptionId: z.uuid("Invalid subscription ID"),
});
const SubscriptionQuerySchema = z.object({
  page: pageNumberValidation,
});
export const GET = withAssociation(
  { params: SubscriptionParamsSchema, query: SubscriptionQuerySchema },
  async (association, { query, params, traceId }, request) => {
    logger.info({
      traceId,
      associationId: association.id,
    }, "GET /api/subscriptions/[subscriptionId]/payments - Request started");

    const user = await withRole(request, UserRole.MEMBER);

    logger.info({
      traceId,
      userId: user.id,
    }, "GET /api/subscriptions/[subscriptionId]/payments - User authorized");

    const page = query?.page || 1;
    const subscriptionId = params?.subscriptionId;
    const userId = request.headers.get("x-user-id")!;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new ForbiddenError("Subscription not found");
    }

    if (subscription.userId !== userId && !hasHighRoleAccess(user.role)) {
      throw new ForbiddenError("Not authorized to view these payments");
    }

    const [data, total] = await prisma.$transaction([
      prisma.paymentTransaction.findMany({
        where: {
          userId: subscription.userId,
          associationId: association.id,
        },
        orderBy: {
          paymentDate: "desc",
        },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),

      prisma.paymentTransaction.count({
        where: {
          userId: subscription.userId,
          associationId: association.id,
        },
      }),
    ]);

    logger.info({
      traceId,
      subscriptionId,
      count: data.length,
    }, "GET /api/subscriptions/[subscriptionId]/payments - Success");

    return SuccessResponse({
      data: data,
      meta: buildPagination(total, page),
    });
  },
);
