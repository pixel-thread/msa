import { NextRequest, NextResponse } from 'next/server';
import { AuditAction } from '@prisma/client';
import { logger } from '@src/shared/logger/server';
import { processWebhookEvent } from '@feature/payments/services/webhook.service';
import { WebhookSignatureError } from '@src/shared/errors';
import { logAction } from '@src/shared/services/audit-logs';

/**
 * POST /api/payments/webhook
 *
 * Razorpay webhook endpoint. This route is PUBLIC (no auth required) because
 * Razorpay calls it directly. Authentication is done via HMAC signature
 * verification using RAZORPAY_WEBHOOK_SECRET.
 *
 * CRITICAL DESIGN DECISIONS:
 *
 * 1. We read the raw body (not parsed JSON) for signature verification.
 *    Razorpay signs the raw payload — if we parse and re-serialize, the
 *    signature check will fail.
 *
 * 2. We always return 200 for valid signatures, even if processing fails
 *    internally — to prevent Razorpay from retrying indefinitely on our
 *    application errors. We store the error in the webhook event record
 *    for later investigation.
 *
 * 3. Idempotency: duplicate events (same eventId) are detected and skipped.
 *
 * 4. For invalid signatures, we return 400 and log the attempt.
 */
export async function POST(request: NextRequest) {
  let rawBody: string;

  logger.info('POST /api/payments/webhook - Request started');

  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  const signature = request.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
  }

  try {
    const result = await processWebhookEvent(rawBody, signature);

    // Log webhook receipt in audit log (best-effort)
    try {
      const payload = JSON.parse(rawBody);
      // Find association from the payment's notes if available
      const notes = payload?.payload?.payment?.entity?.notes;
      const associationId = notes?.associationId;

      if (associationId) {
        await logAction({
          associationId,
          actorId: '',
          action: AuditAction.WEBHOOK_RECEIVED,
          resourceType: 'PaymentWebhookEvent',
          resourceId: result.eventId ?? '',
          newValues: {
            event: payload.event,
            status: result.status,
          },
        });
      }
    } catch {
      // Non-critical — don't fail the webhook for audit logging errors
    }

    logger.info({ event: result.status }, 'POST /api/payments/webhook - Success');

    return NextResponse.json({ status: result.status }, { status: 200 });
  } catch (error) {
    if (error instanceof WebhookSignatureError) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // For all other errors, still return 200 to prevent infinite retries.
    // The error has already been stored in the webhook event record.
    return NextResponse.json(
      { status: 'error', message: 'Webhook processing failed' },
      { status: 200 },
    );
  }
}
