import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { CreateOrderSchema } from "@feature/payments/validators";
import { createPaymentOrder } from "@feature/payments/services/payment.service";

/**
 * POST /api/payments/order
 *
 * Create a Razorpay order for a user's payment.
 * Returns the order details needed to open Razorpay Checkout on the frontend.
 *
 * Requires: FINANCE role or higher.
 */
export const POST = withAssociation(
  { body: CreateOrderSchema },
  async (association, { body }, request) => {
    // Only finance officers and above can initiate orders
    await withRole(request, UserRole.FINANCE);

    const orderDetails = await createPaymentOrder({
      associationId: association.id,
      userId: body!.userId,
      amount: body!.amount,
      notes: body!.notes,
    });

    return SuccessResponse({ data: orderDetails }, 201);
  },
);
