import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { pageNumberValidation } from "@src/shared/validators/common";
import { PAGE_SIZE } from "@src/shared/constants";
import { buildPagination } from "@src/shared/utils/build-pagination";
import { logger } from "@src/shared/logger/server";

const MySubscriptionQuerySchema = z.object({
  page: pageNumberValidation,
});
export const GET = withAssociation(
  { query: MySubscriptionQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info({
      traceId,
      associationId: association.id,
    }, "GET /api/subscriptions/my - Request started");

    const page = query?.page || 1;
    const user = await withRole(request, UserRole.MEMBER);

    logger.info({
      traceId,
      userId: user.id,
    }, "GET /api/subscriptions/my - User authorized");

    const userId = request.headers.get("x-user-id")!;

    const [subscriptions, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where: {
          userId,
        },
        include: {
          plan: true,
          planVersion: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.subscription.count({
        where: { userId },
      }),
    ]);

    logger.info({
      traceId,
      count: subscriptions.length,
    }, "GET /api/subscriptions/my - Success");

    return SuccessResponse({
      data: subscriptions,
      meta: buildPagination(total, page),
    });
  },
);
