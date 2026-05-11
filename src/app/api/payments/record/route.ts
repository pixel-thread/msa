import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { RecordPaymentSchema } from "@feature/payments/validators";
import { ForbiddenError } from "@src/shared/errors";

export const POST = withAssociation(
  { body: RecordPaymentSchema },
  async (association, { body }, request) => {
    const user = await withRole(request, UserRole.FINANCE);

    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Payment record
      const payment = await tx.payment.create({
        data: {
          associationId: association.id,
          userId: body.userId,
          subscriptionId: body.subscriptionId,
          amount: body.amount,
          method: body.method,
          type: body.type,
          notes: body.notes,
          receiptNumber: body.receiptNumber,
          razorpayOrderId: body.razorpayOrderId,
          razorpayPaymentId: body.razorpayPaymentId,
          status: "COMPLETED",
          paymentDate: new Date(),
        },
      });

      // 2. Create the Ledger Entry
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          paymentId: payment.id,
          description: `Payment for ${body.type} - ${body.method}`,
          approvalStatus: "APPROVED", // Finance recorded payments are auto-approved for now
          createdById: user.id,
          approvedById: user.id,
          lines: {
            create: [
              {
                accountId: "BANK", // Placeholder for actual Bank Account ID
                isDebit: true,
                amount: body.amount,
              },
              {
                accountId: body.type, // Map type to an income account placeholder
                isDebit: false,
                amount: body.amount,
              },
            ],
          },
        },
      });

      // 3. If it's a subscription payment, ensure the subscription is active
      if (body.type === "SUBSCRIPTION" && body.subscriptionId) {
        await tx.subscription.update({
          where: { id: body.subscriptionId },
          data: {
            status: "ACTIVE",
          },
        });
      }

      return { payment, ledgerEntry };
    });

    return SuccessResponse({ data: result }, 201);
  }
);
