import { prisma } from "@src/shared/lib/prisma";
import {
  PaymentStatus,
  PaymentGateway,
  ContributionStatus,
  AuditAction,
} from "@prisma/client";
import type { PaymentMethod } from "@prisma/client";

import {
  createRazorpayOrder,
  verifyPaymentSignature,
} from "./razorpay.service";
import { getOutstandingContributions } from "./contribution.service";
import { env } from "@src/env";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateOrderInput {
  associationId: string;
  userId: string;
  /** Amount in INR (rupees, not paise). */
  amount: number;
  notes?: string;
}

export interface VerifyAndCompleteInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RecordManualPaymentInput {
  associationId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  receiptNumber?: string;
  referenceNumber?: string;
  /** The user who recorded this payment (finance/admin). */
  createdById: string;
}

export interface RazorpayOptions {
  description: string;
  image?: string;
  currency: string;
  key: string;
  amount: number;
  name: string;
  transaction_id?: string;

  order_id: string;
  receipt?: string;

  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };

  theme?: {
    color?: string;
  };

  notes?: Record<string, string>;

  retry?: {
    enabled: boolean;
    max_count: number;
  };

  modal?: {
    confirm_close: boolean;
    animation: boolean;
    ondismiss: () => void;
  };

  timeout?: number;

  readonly?: {
    contact: boolean;
    email: boolean;
    name: boolean;
  };

  hide_topbar?: boolean;

  method?: "card" | "upi" | "netbanking" | "wallet" | "emi";

  send_sms_hash?: boolean;

  remember_customer?: boolean;

  customer_id?: string;

  subscription_id?: string;

  config?: {
    display: {
      language: "en" | "ben" | "hi" | "mar" | "guj" | "tam" | "tel";
    };
  };

  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}
// ---------------------------------------------------------------------------
// 1. Create Razorpay Order
// ---------------------------------------------------------------------------

/**
 * Create a pending `PaymentTransaction` and a corresponding Razorpay order.
 *
 * Returns both the transaction ID and the Razorpay order details the frontend
 * needs to open checkout.
 */
export async function createPaymentOrder(input: CreateOrderInput) {
  const amountInPaise = Math.round(input.amount * 100);

  // Create pending transaction first
  const transaction = await prisma.paymentTransaction.create({
    data: {
      associationId: input.associationId,
      userId: input.userId,
      amount: input.amount,
      currency: "INR",
      gateway: PaymentGateway.RAZORPAY,
      status: PaymentStatus.PENDING,
      notes: input.notes,
    },
  });

  // Create Razorpay order
  const razorpayOrder = await createRazorpayOrder({
    amountInPaise,
    receipt: transaction.id,
    notes: {
      transactionId: transaction.id,
      userId: input.userId,
      associationId: input.associationId,
    },
  });

  // Link Razorpay order ID to our transaction
  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: { razorpayOrderId: razorpayOrder.id },
  });

  const options: RazorpayOptions = {
    name: env.NEXT_PUBLIC_ASSOCIATION_SLUG.toUpperCase(),
    transaction_id: transaction.id,
    description: "Membership payment",
    order_id: razorpayOrder.id,
    amount: amountInPaise,
    currency: "INR",
    key: env.RAZORPAY_KEY_ID,
  };

  return options;
}

// ---------------------------------------------------------------------------
// 2. Verify & Complete Online Payment (Client-side callback)
// ---------------------------------------------------------------------------

/**
 * Called after the frontend Razorpay checkout succeeds.
 *
 * 1. Verifies the payment signature
 * 2. Marks the transaction as COMPLETED
 * 3. Allocates payment across outstanding contribution periods (FIFO)
 * 4. Creates ledger entries
 * 5. Writes audit logs
 */
export async function verifyAndCompletePayment(input: VerifyAndCompleteInput) {
  // 1. Verify signature
  const isValid = verifyPaymentSignature({
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpaySignature: input.razorpaySignature,
  });

  if (!isValid) {
    throw new Error("Invalid Razorpay payment signature");
  }

  // 2. Find the pending transaction
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { razorpayOrderId: input.razorpayOrderId },
  });

  if (!transaction) {
    throw new Error(
      `No transaction found for Razorpay order: ${input.razorpayOrderId}`,
    );
  }

  if (transaction.status === PaymentStatus.COMPLETED) {
    // Already processed (idempotent)
    return transaction;
  }

  // 3. Complete the transaction inside a DB transaction
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    // Mark completed
    const updatedTransaction = await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentStatus.COMPLETED,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
        paidAt: now,
        method: "ONLINE" as PaymentMethod,
      },
    });

    // Allocate to contribution periods
    await allocatePaymentToContributions(
      tx,
      transaction.id,
      transaction.userId,
      Number(transaction.amount),
    );

    // Create ledger entry
    await createLedgerEntry(
      tx,
      transaction.id,
      Number(transaction.amount),
      "Online payment via Razorpay",
      transaction.userId, // createdBy = payer for online
    );

    // Audit log
    await tx.auditLog.create({
      data: {
        associationId: transaction.associationId,
        actorId: transaction.userId,
        action: AuditAction.PAYMENT_COMPLETED,
        resourceType: "PaymentTransaction",
        resourceId: transaction.id,
        newValues: {
          razorpayPaymentId: input.razorpayPaymentId,
          amount: Number(transaction.amount),
        },
      },
    });

    return updatedTransaction;
  });
}

// ---------------------------------------------------------------------------
// 3. Record Manual Payment (cash/UPI/bank transfer by finance officer)
// ---------------------------------------------------------------------------

/**
 * Record a manual (offline) payment and allocate it immediately.
 */
export async function recordManualPayment(input: RecordManualPaymentInput) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    // Create completed transaction
    const transaction = await tx.paymentTransaction.create({
      data: {
        associationId: input.associationId,
        userId: input.userId,
        amount: input.amount,
        currency: "INR",
        gateway: PaymentGateway.MANUAL,
        status: PaymentStatus.COMPLETED,
        method: input.method,
        notes: input.notes,
        receiptNumber: input.receiptNumber,
        referenceNumber: input.referenceNumber,
        createdById: input.createdById,
        verifiedById: input.createdById,
        paidAt: now,
        paymentDate: now,
      },
    });

    // Allocate to contribution periods
    await allocatePaymentToContributions(
      tx,
      transaction.id,
      input.userId,
      input.amount,
    );

    // Create ledger entry
    await createLedgerEntry(
      tx,
      transaction.id,
      input.amount,
      `Manual payment (${input.method}) recorded by finance`,
      input.createdById,
    );

    // Audit log
    await tx.auditLog.create({
      data: {
        associationId: input.associationId,
        actorId: input.createdById,
        action: AuditAction.PAYMENT_CREATED,
        resourceType: "PaymentTransaction",
        resourceId: transaction.id,
        newValues: {
          amount: input.amount,
          method: input.method,
          userId: input.userId,
        },
      },
    });

    return transaction;
  });
}

// ---------------------------------------------------------------------------
// 4. FIFO Allocation — Allocate a Payment Across Contribution Periods
// ---------------------------------------------------------------------------

/**
 * Allocate a payment amount across outstanding contribution periods using
 * FIFO (oldest debt first).
 *
 * For each period:
 *   - If remaining >= dueAmount → fully paid
 *   - If remaining > 0 but < dueAmount → partially paid
 *   - If remaining == 0 → stop
 */
async function allocatePaymentToContributions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any, // Prisma transaction client
  paymentTransactionId: string,
  userId: string,
  totalAmount: number,
) {
  const outstanding = await tx.contributionPeriod.findMany({
    where: {
      userId,
      status: {
        in: [
          ContributionStatus.DUE,
          ContributionStatus.PARTIAL,
          ContributionStatus.OVERDUE,
        ],
      },
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  let remaining = totalAmount;

  for (const period of outstanding) {
    if (remaining <= 0) break;

    const dueAmount = Number(period.dueAmount);
    const allocatedAmount = Math.min(remaining, dueAmount);
    const newPaidAmount = Number(period.paidAmount) + allocatedAmount;
    const newDueAmount = dueAmount - allocatedAmount;

    // Determine new status
    let newStatus: ContributionStatus;
    if (newDueAmount <= 0) {
      newStatus = ContributionStatus.PAID;
    } else {
      newStatus = ContributionStatus.PARTIAL;
    }

    // Create allocation record
    await tx.paymentAllocation.create({
      data: {
        paymentTransactionId,
        contributionPeriodId: period.id,
        allocatedAmount,
      },
    });

    // Update contribution period
    await tx.contributionPeriod.update({
      where: { id: period.id },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: Math.max(newDueAmount, 0),
        status: newStatus,
      },
    });

    remaining -= allocatedAmount;
  }

  return remaining; // Excess amount (advance payment)
}

// ---------------------------------------------------------------------------
// 5. Ledger Entry Creation
// ---------------------------------------------------------------------------

async function createLedgerEntry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  paymentTransactionId: string,
  amount: number,
  description: string,
  createdById: string,
) {
  return tx.ledgerEntry.create({
    data: {
      paymentTransactionId,
      description,
      approvalStatus: "APPROVED",
      createdById,
      approvedById: createdById,
      lines: {
        create: [
          {
            accountId: "BANK",
            isDebit: true,
            amount,
          },
          {
            accountId: "SUBSCRIPTION_INCOME",
            isDebit: false,
            amount,
          },
        ],
      },
    },
  });
}

// ---------------------------------------------------------------------------
// 6. Mark Payment as Failed
// ---------------------------------------------------------------------------

export async function markPaymentFailed(
  razorpayOrderId: string,
  reason?: string,
) {
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { razorpayOrderId },
  });

  if (!transaction) return null;

  const updated = await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: PaymentStatus.FAILED,
      failedAt: new Date(),
      notes: reason
        ? `${transaction.notes ?? ""}\nFailure: ${reason}`.trim()
        : transaction.notes,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      associationId: transaction.associationId,
      actorId: transaction.userId,
      action: AuditAction.PAYMENT_FAILED,
      resourceType: "PaymentTransaction",
      resourceId: transaction.id,
      newValues: { reason },
    },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// 7. Get Payment History
// ---------------------------------------------------------------------------

export async function getUserPaymentHistory(
  userId: string,
  page = 1,
  pageSize = 20,
) {
  const skip = (page - 1) * pageSize;

  const [transactions, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where: { userId },
      include: {
        allocations: {
          include: {
            contributionPeriod: {
              select: {
                year: true,
                month: true,
                expectedAmount: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.paymentTransaction.count({ where: { userId } }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: skip + pageSize < total,
    },
  };
}
