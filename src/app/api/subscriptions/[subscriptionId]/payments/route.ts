import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";
import { ForbiddenError } from "@src/shared/errors";

export const GET = withAssociation({}, async (association, _, request, { params }) => {
  const user = await withRole(request, UserRole.MEMBER);
  const userId = request.headers.get("x-user-id")!;

  const { subscriptionId } = (await params) as { subscriptionId: string };

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new ForbiddenError("Subscription not found");
  }

  if (subscription.userId !== userId && !hasHighRoleAccess(user.role)) {
    throw new ForbiddenError("Not authorized to view these payments");
  }

  const payments = await prisma.payment.findMany({
    where: {
      subscriptionId,
      associationId: association.id,
    },
    orderBy: {
      paymentDate: "desc",
    },
  });

  return SuccessResponse({ data: payments });
});
