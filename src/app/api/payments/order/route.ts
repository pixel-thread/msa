import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { CreateOrderSchema } from "@feature/payments/validators";
import { createPaymentOrder } from "@feature/payments/services/payment.service";
import { prisma } from "@src/shared/lib/prisma";
import { NotFoundError } from "@src/shared/errors";
import { getActiveProvider } from "@src/features/payments/services/payment-provider.service";

/**
 * POST /api/payments/order
 *
 * Create a Razorpay order for a user's payment.
 * Returns the order details needed to open Razorpay Checkout on the frontend.
 *
 * Requires: MEMBER role or higher.
 */
export const POST = withAssociation(
  { body: CreateOrderSchema },
  async (association, { body }, request) => {
    const user = await withRole(request, UserRole.MEMBER);
    const typeId = user?.memberTypeId;

    const associationActivePaymentProvider = getActiveProvider(association.id);

    if (!associationActivePaymentProvider)
      throw new NotFoundError(
        "No payment provider set up for this association.",
      );

    const plan = await prisma.subscriptionPlan.findFirst({
      where: {
        associationId: association.id,
        memberTypeId: typeId ?? null,
        isActive: true,
      },
      include: {
        versions: {
          where: { effectiveTo: null },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!plan || plan.versions.length === 0) {
      throw new NotFoundError("Plan not found under this member Group");
    }

    const activeVersion = plan.versions[0];

    const orderDetails = await createPaymentOrder({
      associationId: association.id,
      userId: user?.id,
      amount: parseInt(activeVersion.amount.toFixed(2)),
      notes: body!.notes,
    });

    return SuccessResponse({ data: orderDetails }, 201);
  },
);
