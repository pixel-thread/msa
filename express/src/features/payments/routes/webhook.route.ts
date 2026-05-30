// ---------------------------------------------------------------------------
// ENDPOINT:  POST /api/payments/webhook
// SECURITY:  No auth — webhook signature verification is the auth
// PURPOSE:   Receive Razorpay webhook events (payment.captured,
//            payment.failed, refund.processed, etc.) and process them.
//            The raw body is needed for HMAC verification, so this route
//            must use express.raw() or express.text() middleware upstream.
// ---------------------------------------------------------------------------

import { Request, Response, NextFunction } from 'express';
import type { RequestHandler } from 'express';

import { AuditAction } from '@prisma/client';
import { logger } from '@src/shared/logger';
import { processWebhookEvent } from '@src/features/payments/services/webhook.service';
import { WebhookSignatureError } from '@src/shared/errors';
import { logAction } from '@src/shared/services/audit-logs';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- Handler ----

export const webhook: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // --- Log: request started ---
    logger.info('POST /api/payments/webhook - Request started');

    // --- Step 1: Extract raw body for signature verification ---
    // Razorpay signs the raw JSON body with HMAC-SHA256; express.json()
    // may have already consumed the stream, so we read req.body as-is.
    let rawBody: string;
    try {
      rawBody = req.body
        ? typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body)
        : '';
    } catch {
      return res.status(400).json({ error: 'Failed to read request body' });
    }

    // --- Step 2: Validate signature header ---
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
    }

    // --- Step 3: Process the webhook event ---
    try {
      const result = await processWebhookEvent(rawBody, signature);

      // Step 4: Non-critical audit logging (best-effort)
      try {
        const payload = JSON.parse(rawBody);
        const notes = payload?.payload?.payment?.entity?.notes;
        const associationId = notes?.associationId;
        if (associationId) {
          await logAction({
            associationId,
            actorId: '',
            action: AuditAction.WEBHOOK_RECEIVED,
            resourceType: 'PaymentWebhookEvent',
            resourceId: result.eventId ?? '',
            newValues: { event: payload.event, status: result.status },
          });
        }
      } catch {
        // Non-critical — don't let audit-log failures break the response
      }

      // --- Log: success ---
      logger.info({ event: result.status }, 'POST /api/payments/webhook - Success');

      return res.status(200).json({ status: result.status });
    } catch (error) {
      // Step 5: Handle known error types with appropriate HTTP status
      if (error instanceof WebhookSignatureError) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
      // Return 200 even on processing errors so Razorpay does not retry
      // endlessly; the error is recorded in the DB by processWebhookEvent.
      return res.status(200).json({ status: 'error', message: 'Webhook processing failed' });
    }
  }),
];
