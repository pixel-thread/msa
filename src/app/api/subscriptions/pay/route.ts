import { auth } from "@clerk/nextjs/server";

import { SuccessResponse, ErrorResponse } from "@src/shared/utils/responses";
import { makePayment } from "@feature/subscription/services";
import { prisma } from "@src/shared/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponse("Authentication required", 401);
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return ErrorResponse("User not found", 404);
    }

    const plan = await prisma.subscriptionPlan.findFirst({
      where: {
        associationId: user.associationId,
        isActive: true,
      },
    });

    if (!plan) {
      return ErrorResponse("No membership plan available", 404);
    }

    const result = await makePayment(user.id, plan.id);

    if (result.status === "already_paid") {
      return SuccessResponse({
        data: {
          status: "paid",
          payment: {
            id: result.payment.id,
            amount: result.payment.amount,
            currency: result.payment.currency,
            receiptNumber: result.payment.receiptNumber,
            paymentDate: result.payment.paymentDate,
          },
        },
        message: "Membership fee already paid",
      });
    }

    return SuccessResponse(
      {
        data: {
          status: "paid",
          payment: {
            id: result.payment.id,
            amount: result.payment.amount,
            currency: result.payment.currency,
            receiptNumber: result.payment.receiptNumber,
            paymentDate: result.payment.paymentDate,
          },
        },
        message: "Payment successful",
      },
      201,
    );
  } catch (error) {
    if (error instanceof Error) {
      return ErrorResponse(error.message, 400);
    }
    return ErrorResponse("Internal server error", 500);
  }
}