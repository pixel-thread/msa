import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";
import { ForbiddenError } from "@src/shared/errors";
import { pageNumberValidation } from "@src/shared/validators/common";
import z from "zod";
import { PAGE_SIZE } from "@src/shared/constants";
import { buildPagination } from "@src/shared/utils/build-pagination";

const SubscriptionParamsSchema = z.object({
  subscriptionId: z.uuid("Invalid subscription ID"),
});
const SubscriptionQuerySchema = z.object({
  page: pageNumberValidation,
});
export const GET = withAssociation(
  { params: SubscriptionParamsSchema, query: SubscriptionQuerySchema },
  async (association, { query, params }, request) => {
    const user = await withRole(request, UserRole.MEMBER);
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
    return SuccessResponse({
      data: data,
      meta: buildPagination(total, page),
    });
  },
);
