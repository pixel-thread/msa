import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { WaiveSubscriptionSchema } from "@feature/subscriptions/validators";
import { NotFoundError, ValidationError } from "@src/shared/errors";
import { logger } from "@src/shared/logger/server";

export const POST = withAssociation(
  { body: WaiveSubscriptionSchema },
  async (association, { body, traceId }, request) => {
    logger.info({
      traceId,
      associationId: association.id,
    }, "POST /api/subscriptions/waive - Request started");

    const user = await withRole(request, UserRole.SECRETARY);

    logger.info({
      traceId,
      userId: user.id,
    }, "POST /api/subscriptions/waive - User authorized");

    if (!body) throw new ValidationError("Invalid request body");

    const updated = await prisma.subscription.update({
      where: {
        id: body.subscriptionId,
        user: {
          associationId: association.id,
        },
      },
      data: {
        status: "WAIVED",
        waivedAt: new Date(),
        waivedReason: body.reason,
        waivedBy: user.id,
      },
    });

    if (!updated)
      throw new NotFoundError("Subscription not found in this association");

    logger.info({
      traceId,
      subscriptionId: body.subscriptionId,
    }, "POST /api/subscriptions/waive - Success");

    return SuccessResponse({ data: updated });
  },
);
