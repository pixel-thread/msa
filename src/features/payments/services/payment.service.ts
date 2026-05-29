import { prisma } from '@src/shared/lib/prisma';
import {
  Prisma,
  PaymentStatus,
  PaymentGateway,
  ContributionStatus,
  AuditAction,
  PaymentMethod,
} from '@prisma/client';
import { buildPagination } from '@src/shared/utils/build-pagination';

import { verifyPaymentSignature } from './razorpay.service';
import { getActiveProvider, getProviderById } from './payment-provider.service';
import { decrypt } from '@src/shared/lib/crypto';
import { env } from '@src/env';
import Razorpay from 'razorpay';
import { BadRequestError, NotFoundError, PaymentError } from '@src/shared/errors';
import { logAction } from '@src/shared/services/audit-logs';
import { PAGE_SIZE } from '@src/shared/constants';
import { createLedgerEntry } from '@src/features/ledger/services/ledger.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TransactionFilters {
  page?: number;
  userId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  gateway?: PaymentGateway;
  search?: string;
  startDate?: string;
  endDate?: string | Date;
}

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

  method?: 'card' | 'upi' | 'netbanking' | 'wallet' | 'emi';

  send_sms_hash?: boolean;

  remember_customer?: boolean;

  customer_id?: string;

  subscription_id?: string;

  config?: {
    display: {
      language: 'en' | 'ben' | 'hi' | 'mar' | 'guj' | 'tam' | 'tel';
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

  const provider = await getActiveProvider(input.associationId, 'RAZORPAY');

  let keyId: string;
  let keySecret: string;

  if (provider) {
    keyId = provider.keyId;
    keySecret = decrypt(provider.encryptedKeySecret);
  } else {
    keyId = env.RAZORPAY_KEY_ID ?? '';
    keySecret = env.RAZORPAY_KEY_SECRET ?? '';

    if (!keyId || !keySecret) {
      throw new NotFoundError('No payment provider configured and no env vars set');
    }
  }

  let razorpayClient;
  try {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new PaymentError(
      error?.error?.description || 'Payment failed',
      error?.error?.code,
      error?.statusCode,
    );
  }

  // Create pending transaction first
  const transaction = await prisma.paymentTransaction.create({
    data: {
      associationId: input.associationId,
      userId: input.userId,
      amount: input.amount,
      currency: 'INR',
      gateway: PaymentGateway.RAZORPAY,
      status: PaymentStatus.PENDING,
      notes: input.notes,
    },
  });

  // Create Razorpay order
  let razorpayOrder;

  try {
    razorpayOrder = await razorpayClient.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: transaction.id,
      notes: {
        transactionId: transaction.id,
        userId: input.userId,
        associationId: input.associationId,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new PaymentError(
      error?.error?.description || 'Payment failed',
      error?.error?.code,
      error?.statusCode,
    );
  }

  // Link Razorpay order ID to our transaction
  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: { razorpayOrderId: razorpayOrder.id },
  });

  const options: RazorpayOptions = {
    name: env.NEXT_PUBLIC_ASSOCIATION_SLUG.toUpperCase(),
    transaction_id: transaction.id,
    description: 'Membership payment',
    order_id: razorpayOrder.id,
    amount: amountInPaise,
    currency: 'INR',
    key: keyId,
  };

  return options;
}

// ---------------------------------------------------------------------------
// 1b. Create Test Razorpay Order (Admin)
// ---------------------------------------------------------------------------

export interface CreateTestOrderInput {
  associationId: string;
  userId: string;
  providerId: string;
}

/**
 * Create a test payment order for ₹1 using a specific provider.
 * Skips subscription plan lookup — uses a fixed amount.
 * Returns RazorpayOptions for the frontend checkout.
 */
export async function createTestPaymentOrder(input: CreateTestOrderInput) {
  const provider = await getProviderById(input.providerId, input.associationId);

  if (!provider || provider.provider !== 'RAZORPAY') {
    throw new BadRequestError('Provider must be a Razorpay provider');
  }

  const fullProvider = await prisma.paymentProvider.findUnique({
    where: { id: input.providerId },
  });

  if (!fullProvider) {
    throw new NotFoundError('Provider not found');
  }

  const keySecret = decrypt(fullProvider.encryptedKeySecret);

  let razorpayClient;
  try {
    razorpayClient = new Razorpay({
      key_id: provider.keyId,
      key_secret: keySecret,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new PaymentError(
      error?.error?.description || 'Payment failed',
      error?.error?.code,
      error?.statusCode,
    );
  }

  const testAmount = 1;
  const amountInPaise = 100;

  const transaction = await prisma.paymentTransaction.create({
    data: {
      associationId: input.associationId,
      userId: input.userId,
      amount: testAmount,
      currency: 'INR',
      gateway: PaymentGateway.RAZORPAY,
      status: PaymentStatus.PENDING,
      notes: 'Test payment',
    },
  });

  let razorpayOrder;
  try {
    razorpayOrder = await razorpayClient.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: transaction.id,
      notes: {
        transactionId: transaction.id,
        userId: input.userId,
        associationId: input.associationId,
        isTest: 'true',
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new PaymentError(
      error?.error?.description || 'Payment failed',
      error?.error?.code,
      error?.statusCode,
    );
  }

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: { razorpayOrderId: razorpayOrder.id },
  });

  const options: RazorpayOptions = {
    name: env.NEXT_PUBLIC_ASSOCIATION_SLUG.toUpperCase(),
    transaction_id: transaction.id,
    description: 'Test payment (₹1)',
    order_id: razorpayOrder.id,
    amount: amountInPaise,
    currency: 'INR',
    key: provider.keyId,
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
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { razorpayOrderId: input.razorpayOrderId },
  });

  if (!transaction) {
    throw new NotFoundError(`No transaction found for Razorpay order: ${input.razorpayOrderId}`);
  }

  if (transaction.status === PaymentStatus.COMPLETED) {
    return transaction;
  }

  const provider = await getActiveProvider(transaction.associationId, 'RAZORPAY');

  let keySecret: string | undefined;
  if (provider) {
    keySecret = decrypt(provider.encryptedKeySecret);
  }

  const isValid = verifyPaymentSignature(
    {
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
    },
    keySecret,
  );

  if (!isValid) {
    throw new BadRequestError('Invalid Razorpay payment signature');
  }

  return prisma.$transaction(async (tx) => {
    const now = new Date();

    const updatedTransaction = await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentStatus.COMPLETED,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
        paidAt: now,
        method: 'ONLINE' as PaymentMethod,
      },
    });

    await allocatePaymentToContributions(
      tx,
      transaction.id,
      transaction.userId,
      Number(transaction.amount),
    );

    await createLedgerEntry(
      tx,
      transaction.id,
      Number(transaction.amount),
      'Online payment via Razorpay',
      transaction.userId,
    );

    await tx.auditLog.create({
      data: {
        associationId: transaction.associationId,
        actorId: transaction.userId,
        action: AuditAction.PAYMENT_COMPLETED,
        resourceType: 'PaymentTransaction',
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
// 2b. Verify Test Payment (Admin — skips allocation & ledger)
// ---------------------------------------------------------------------------

/**
 * Verify a test Razorpay payment and mark the transaction COMPLETED.
 * Unlike verifyAndCompletePayment, this does NOT allocate to contributions
 * or create ledger entries — it's purely for testing provider connectivity.
 */
export async function verifyTestPayment(input: VerifyAndCompleteInput) {
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { razorpayOrderId: input.razorpayOrderId },
  });

  if (!transaction) {
    throw new NotFoundError(`No transaction found for Razorpay order: ${input.razorpayOrderId}`);
  }

  if (transaction.status === PaymentStatus.COMPLETED) {
    return transaction;
  }

  const provider = await getActiveProvider(transaction.associationId, 'RAZORPAY');

  let keySecret: string | undefined;
  if (provider) {
    keySecret = decrypt(provider.encryptedKeySecret);
  }

  const isValid = verifyPaymentSignature(
    {
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
    },
    keySecret,
  );

  if (!isValid) {
    throw new BadRequestError('Invalid Razorpay payment signature');
  }

  const now = new Date();

  const updatedTransaction = await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: PaymentStatus.COMPLETED,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
      paidAt: now,
      method: 'ONLINE' as PaymentMethod,
      notes: transaction.notes ? `${transaction.notes} (completed)` : 'Test payment (completed)',
    },
  });

  // Minimal audit log
  await logAction({
    associationId: transaction.associationId,
    actorId: transaction.userId,
    action: AuditAction.PAYMENT_COMPLETED,
    resourceType: 'PaymentTransaction',
    resourceId: transaction.id,
    newValues: {
      razorpayPaymentId: input.razorpayPaymentId,
      amount: Number(transaction.amount),
      isTest: true,
    },
  });

  return updatedTransaction;
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
        currency: 'INR',
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
    await allocatePaymentToContributions(tx, transaction.id, input.userId, input.amount);

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
        resourceType: 'PaymentTransaction',
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
  tx: Prisma.TransactionClient, // Prisma transaction client
  paymentTransactionId: string,
  userId: string,
  totalAmount: number,
) {
  const outstanding = await tx.contributionPeriod.findMany({
    where: {
      userId,
      status: {
        in: [ContributionStatus.DUE, ContributionStatus.PARTIAL, ContributionStatus.OVERDUE],
      },
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
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
// 5. Mark Payment as Failed
// ---------------------------------------------------------------------------

export async function markPaymentFailed(razorpayOrderId: string, reason?: string) {
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { razorpayOrderId },
  });

  if (!transaction) return null;

  const updated = await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: PaymentStatus.FAILED,
      failedAt: new Date(),
      notes: reason ? `${transaction.notes ?? ''}\nFailure: ${reason}`.trim() : transaction.notes,
    },
  });

  // Audit log
  await logAction({
    associationId: transaction.associationId,
    actorId: transaction.userId,
    action: AuditAction.PAYMENT_FAILED,
    resourceType: 'PaymentTransaction',
    resourceId: transaction.id,
    newValues: { reason },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// 6. Get Payment History
// ---------------------------------------------------------------------------

export async function getUserPaymentHistory(userId: string, page = 1) {
  const validPage = Math.max(1, page);
  const skip = (validPage - 1) * PAGE_SIZE;

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
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.paymentTransaction.count({ where: { userId } }),
  ]);

  return {
    transactions,
    pagination: buildPagination(total, page),
  };
}

// ---------------------------------------------------------------------------
// 7. Admin Transaction Management
// ---------------------------------------------------------------------------

/**
 * List all transactions with advanced filtering for admin dashboard.
 */
export async function getAllTransactions(associationId: string, filters: TransactionFilters) {
  const { page = 1, userId, status, method, gateway, search, startDate, endDate } = filters;

  const validPage = Math.max(1, page);
  const skip = (validPage - 1) * PAGE_SIZE;

  const where: Prisma.PaymentTransactionWhereInput = { associationId };

  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (method) where.method = method;
  if (gateway) where.gateway = gateway;

  if (startDate || endDate) {
    const createdAt: Prisma.DateTimeFilter = {};

    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        createdAt.gte = start;
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        createdAt.lte = end;
      }
    }

    if (Object.keys(createdAt).length > 0) {
      where.createdAt = createdAt;
    }
  }

  if (search) {
    where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { receiptNumber: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { membershipNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, membershipNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.paymentTransaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: buildPagination(total, validPage, PAGE_SIZE),
  };
}

/**
 * Fetch a specific transaction with its full context (user, allocations, ledger).
 */
export async function getTransactionById(id: string, associationId: string) {
  return prisma.paymentTransaction.findFirst({
    where: { id, associationId },
    include: {
      user: { select: { name: true, email: true, membershipNumber: true } },
      allocations: { include: { contributionPeriod: true } },
      ledgerEntries: { include: { lines: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// 8. Financial Statistics
// ---------------------------------------------------------------------------

/**
 * Get top-level financial summary for an association dashboard.
 */
export async function getFinancialStats(associationId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthTotal, duesSum, uniqueUsersWithDues] = await Promise.all([
    prisma.paymentTransaction.aggregate({
      where: {
        associationId,
        status: PaymentStatus.COMPLETED,
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.contributionPeriod.aggregate({
      where: {
        associationId,
        status: {
          in: [ContributionStatus.DUE, ContributionStatus.PARTIAL, ContributionStatus.OVERDUE],
        },
      },
      _sum: { dueAmount: true },
    }),
    prisma.contributionPeriod.groupBy({
      by: ['userId'],
      where: {
        associationId,
        status: {
          in: [ContributionStatus.DUE, ContributionStatus.PARTIAL, ContributionStatus.OVERDUE],
        },
      },
    }),
  ]);

  return {
    stats: {
      totalCollectedMonth: Number(monthTotal._sum.amount || 0),
      pendingDuesAmount: Number(duesSum._sum.dueAmount || 0),
      pendingDuesCount: uniqueUsersWithDues.length,
    },
    pagination: buildPagination(uniqueUsersWithDues.length, 1),
  };
}
