import { Request, Response, NextFunction } from 'express';
import type { RequestHandler } from 'express';
import { AuditAction } from '@prisma/client';
import { logger } from '@src/shared/logger';
import { processWebhookEvent } from '@src/features/payments/services/webhook.service';
import { WebhookSignatureError } from '@src/shared/errors';
import { logAction } from '@src/shared/services/audit-logs';
import { asyncHandler } from '@src/shared/utils/async-handler';

export const webhook: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    logger.info('POST /api/payments/webhook - Request started');
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
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
    }
    try {
      const result = await processWebhookEvent(rawBody, signature);
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
        // Non-critical
      }
      logger.info({ event: result.status }, 'POST /api/payments/webhook - Success');
      return res.status(200).json({ status: result.status });
    } catch (error) {
      if (error instanceof WebhookSignatureError) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
      return res.status(200).json({ status: 'error', message: 'Webhook processing failed' });
    }
  }),
];
