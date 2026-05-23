import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { WaiveSubscriptionSchema } from "@feature/subscriptions/validators";
import { NotFoundError, ValidationError } from "@src/shared/errors";

export const POST = withAssociation(
  { body: WaiveSubscriptionSchema },
  async (association, { body }, request) => {
    const user = await withRole(request, UserRole.SECRETARY);

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

    return SuccessResponse({ data: updated });
  },
);
