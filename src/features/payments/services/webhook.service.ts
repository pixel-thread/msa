import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { AuditAction, PaymentGateway } from '@prisma/client';
import { verifyWebhookSignature } from './razorpay.service';
import { markPaymentFailed } from './payment.service';
import { getActiveProvider } from './payment-provider.service';
import { decrypt } from '@src/shared/lib/crypto';
import { WebhookSignatureError } from '@src/shared/errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        description?: string;
        error_code?: string;
        error_description?: string;
        error_reason?: string;
        notes?: Record<string, string>;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        receipt: string;
        status: string;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        currency: string;
        status: string;
      };
    };
  };
  created_at: number;
}

// ---------------------------------------------------------------------------
// Webhook Handler
// ---------------------------------------------------------------------------

/**
 * Process an incoming Razorpay webhook event.
 *
 * This function is idempotent — duplicate webhook events (same `eventId`)
 * are safely skipped.
 *
 * Flow:
 * 1. Verify signature
 * 2. Check for duplicate (via eventId)
 * 3. Store the raw event
 * 4. Route to the correct handler based on event type
 * 5. Mark event as processed
 */
export async function processWebhookEvent(
  rawBody: string,
  signature: string,
): Promise<{ status: 'ok' | 'duplicate' | 'unhandled'; eventId?: string }> {
  const payload: RazorpayWebhookPayload = JSON.parse(rawBody);

  let webhookSecret: string | undefined;

  const paymentOrderId = payload.payload.payment?.entity?.order_id;
  if (paymentOrderId) {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { razorpayOrderId: paymentOrderId },
    });

    if (transaction) {
      const provider = await getActiveProvider(transaction.associationId, 'RAZORPAY');
      if (provider && provider.encryptedWebhookSecret) {
        webhookSecret = decrypt(provider.encryptedWebhookSecret);
      }
    }
  }

  const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    throw new WebhookSignatureError('Invalid webhook signature');
  }

  // Construct a deterministic event ID from Razorpay's data
  // Razorpay doesn't send a unique event ID in every webhook,
  // so we construct one from event type + payment/order ID + timestamp
  const eventId = constructEventId(payload);

  // 2. Check for duplicate processing (idempotency)
  if (eventId) {
    const existing = await prisma.paymentWebhookEvent.findUnique({
      where: { eventId },
    });

    if (existing?.processed) {
      return { status: 'duplicate', eventId };
    }
  }

  // 3. Store the raw event (before processing, so we never lose data)
  const webhookEvent = await prisma.paymentWebhookEvent.upsert({
    where: { eventId: eventId ?? '' },
    create: {
      eventId,
      eventType: payload.event,
      gateway: PaymentGateway.RAZORPAY,
      // eslint-disable-next-line
      payload: payload as any,
      signature,
      processed: false,
    },
    update: {}, // No-op if exists — don't overwrite
  });

  // 4. Route to handler
  try {
    await routeWebhookEvent(payload);

    // 5. Mark as processed
    await prisma.paymentWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return { status: 'ok', eventId: eventId ?? undefined };
  } catch (error) {
    // Store error but don't crash — Razorpay will retry
    await prisma.paymentWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        errorMessage: error instanceof Error ? error.message : 'Unknown processing error',
      },
    });

    throw error; // Re-throw so the HTTP response is 500 → Razorpay retries
  }
}

// ---------------------------------------------------------------------------
// Event Router
// ---------------------------------------------------------------------------

async function routeWebhookEvent(payload: RazorpayWebhookPayload): Promise<void> {
  const event = payload.event;

  switch (event) {
    case 'payment.authorized':
      // Payment authorized but not yet captured
      // In most flows with auto-capture, this is followed by payment.captured
      await handlePaymentAuthorized(payload);
      break;

    case 'payment.captured':
      // Payment successfully captured — this is the "success" event
      await handlePaymentCaptured(payload);
      break;

    case 'payment.failed':
      // Payment attempt failed
      await handlePaymentFailed(payload);
      break;

    case 'refund.created':
    case 'refund.processed':
      await handleRefund(payload);
      break;

    case 'order.paid':
      // Order fully paid — can be used as a secondary confirmation
      // We primarily rely on payment.captured
      break;

    default:
      // Log but don't fail for unknown events
      console.warn(`[Webhook] Unhandled Razorpay event: ${event}`);
  }
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

async function handlePaymentAuthorized(payload: RazorpayWebhookPayload): Promise<void> {
  const payment = payload.payload.payment?.entity;
  if (!payment) return;

  // Just log it — we wait for payment.captured to complete the flow
  console.info(`[Webhook] Payment authorized: ${payment.id} for order ${payment.order_id}`);
}

async function handlePaymentCaptured(payload: RazorpayWebhookPayload): Promise<void> {
  const payment = payload.payload.payment?.entity;
  if (!payment) return;

  // Find the transaction by Razorpay order ID
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { razorpayOrderId: payment.order_id },
  });

  if (!transaction) {
    console.error(`[Webhook] No transaction found for order: ${payment.order_id}`);
    return;
  }

  // If already completed, skip (idempotent)
  if (transaction.status === 'COMPLETED') {
    return;
  }

  // Use the same flow as the client-side verification
  // but skip signature verification (webhook signature was already verified)
  await verifyAndCompletePaymentFromWebhook(
    transaction.id,
    // payment.id,
    payment.order_id,
  );
}

async function handlePaymentFailed(payload: RazorpayWebhookPayload): Promise<void> {
  const payment = payload.payload.payment?.entity;
  if (!payment) return;

  const reason = [payment.error_code, payment.error_description, payment.error_reason]
    .filter(Boolean)
    .join(' — ');

  await markPaymentFailed(payment.order_id, reason || 'Payment failed');
}

async function handleRefund(payload: RazorpayWebhookPayload): Promise<void> {
  const refund = payload.payload.refund?.entity;
  if (!refund) return;

  // Find the original transaction
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { razorpayPaymentId: refund.payment_id },
  });

  if (!transaction) {
    console.error(`[Webhook] No transaction found for refund payment: ${refund.payment_id}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Update transaction status
    await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'REFUNDED',
        razorpayRefundId: refund.id,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        associationId: transaction.associationId,
        actorId: null, // System-initiated via webhook
        action: AuditAction.PAYMENT_REFUNDED,
        resourceType: 'PaymentTransaction',
        resourceId: transaction.id,
        newValues: {
          refundId: refund.id,
          refundAmount: refund.amount / 100,
          refundStatus: refund.status,
        },
      },
    });

    // Reverse allocations — revert contribution periods to DUE
    const allocations = await tx.paymentAllocation.findMany({
      where: { paymentTransactionId: transaction.id },
      include: { contributionPeriod: true },
    });

    for (const allocation of allocations) {
      const period = allocation.contributionPeriod;
      const newPaidAmount = Number(period.paidAmount) - Number(allocation.allocatedAmount);
      const newDueAmount = Number(period.dueAmount) + Number(allocation.allocatedAmount);

      await tx.contributionPeriod.update({
        where: { id: period.id },
        data: {
          paidAmount: Math.max(newPaidAmount, 0),
          dueAmount: newDueAmount,
          status: newPaidAmount <= 0 ? 'DUE' : 'PARTIAL',
        },
      });
    }

    // Delete allocations
    await tx.paymentAllocation.deleteMany({
      where: { paymentTransactionId: transaction.id },
    });

    // Create reverse ledger entry
    await tx.ledgerEntry.create({
      data: {
        paymentTransactionId: transaction.id,
        description: `Refund — Razorpay refund ${refund.id}`,
        approvalStatus: 'APPROVED',
        createdById: transaction.userId,
        lines: {
          create: [
            {
              accountId: 'SUBSCRIPTION_INCOME',
              isDebit: true,
              amount: refund.amount / 100,
            },
            {
              accountId: 'BANK',
              isDebit: false,
              amount: refund.amount / 100,
            },
          ],
        },
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Internal helper — complete payment from webhook (skips client signature check)
// ---------------------------------------------------------------------------

async function verifyAndCompletePaymentFromWebhook(
  transactionId: string,
  razorpayPaymentId: string,
) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    const transaction = await tx.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction || transaction.status === 'COMPLETED') {
      return transaction;
    }

    // Mark completed
    const updated = await tx.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId,
        paidAt: now,
        method: 'ONLINE',
      },
    });

    // Allocate to contribution periods
    const outstanding = await tx.contributionPeriod.findMany({
      where: {
        userId: transaction.userId,
        status: { in: ['DUE', 'PARTIAL', 'OVERDUE'] },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    let remaining = Number(transaction.amount);

    for (const period of outstanding) {
      if (remaining <= 0) break;

      const dueAmount = Number(period.dueAmount);
      const allocatedAmount = Math.min(remaining, dueAmount);
      const newPaidAmount = Number(period.paidAmount) + allocatedAmount;
      const newDueAmount = dueAmount - allocatedAmount;

      await tx.paymentAllocation.create({
        data: {
          paymentTransactionId: transactionId,
          contributionPeriodId: period.id,
          allocatedAmount,
        },
      });

      await tx.contributionPeriod.update({
        where: { id: period.id },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: Math.max(newDueAmount, 0),
          status: newDueAmount <= 0 ? 'PAID' : 'PARTIAL',
        },
      });

      remaining -= allocatedAmount;
    }

    // Create ledger entry
    await tx.ledgerEntry.create({
      data: {
        paymentTransactionId: transactionId,
        description: 'Online payment via Razorpay (webhook confirmed)',
        approvalStatus: 'APPROVED',
        createdById: transaction.userId,
        lines: {
          create: [
            {
              accountId: 'BANK',
              isDebit: true,
              amount: Number(transaction.amount),
            },
            {
              accountId: 'SUBSCRIPTION_INCOME',
              isDebit: false,
              amount: Number(transaction.amount),
            },
          ],
        },
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        associationId: transaction.associationId,
        actorId: transaction.userId,
        action: AuditAction.PAYMENT_COMPLETED,
        resourceType: 'PaymentTransaction',
        resourceId: transactionId,
        newValues: {
          razorpayPaymentId,
          source: 'webhook',
          amount: Number(transaction.amount),
        },
      },
    });

    return updated;
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function constructEventId(payload: RazorpayWebhookPayload): string | null {
  const event = payload.event;
  const payment = payload.payload.payment?.entity;
  const refund = payload.payload.refund?.entity;

  if (payment) {
    return `${event}:${payment.id}:${payload.created_at}`;
  }

  if (refund) {
    return `${event}:${refund.id}:${payload.created_at}`;
  }

  return null;
}
