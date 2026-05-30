import { Request, Response, NextFunction } from 'express';
import type { RequestHandler } from 'express';

import { env } from '@src/env';
import { logger } from '@src/shared/logger';
import { asyncHandler } from '@src/shared/utils/async-handler';

import {
  runSubscriptionExpiryCron,
  runDsarSlaCron,
  runAnonymizeCron,
} from '@src/features/cron/services';

// ---- Helpers -----------------------------------------------------------------

/** Verify the CRON secret from authorization header. */
function verifyCronSecret(req: Request): boolean {
  const authHeader = req.headers['authorization'] as string;
  return authHeader === `Bearer ${env.CRON_SECRET}`;
}

// ---- Handlers ----------------------------------------------------------------
// POST /api/cron/subscription-expiry
// Description: Trigger subscription expiry check (cron job)
// Security: Bearer token (CRON_SECRET)

export const postSubscriptionExpiry: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('POST /api/cron/subscription-expiry - Request started');

      if (!verifyCronSecret(req)) {
        logger.warn('POST /api/cron/subscription-expiry - Unauthorized access attempt');
        return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
      }

      const results = await runSubscriptionExpiryCron();
      const totalExpired = results.reduce((sum, r) => sum + r.expired, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
      const processedAssociations = results.filter((r) => r.expired > 0 || !r.error).length;

      logger.info(
        { totalAssociations: results.length, processedAssociations, totalExpired, totalFailed },
        'POST /api/cron/subscription-expiry - Subscription expiry check completed',
      );

      return res.json({
        success: true,
        message: 'Subscription expiry check completed',
        summary: {
          totalAssociations: results.length,
          processedAssociations,
          totalExpired,
          totalFailed,
        },
        results,
      });
    } catch (error) {
      logger.error({ error }, 'POST /api/cron/subscription-expiry - Unhandled error');
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }),
];

// POST /api/cron/dsar-sla
// Description: Trigger DSAR SLA deadline check (cron job)
// Security: Bearer token (CRON_SECRET)

export const postDsarSla: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('POST /api/cron/dsar-sla - Request started');

      if (!verifyCronSecret(req)) {
        logger.warn('POST /api/cron/dsar-sla - Unauthorized access attempt');
        return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
      }

      const results = await runDsarSlaCron();
      const totalBreached = results.reduce((sum, r) => sum + r.breached, 0);
      const totalAtRisk = results.reduce((sum, r) => sum + r.atRisk, 0);
      const processedAssociations = results.filter((r) => r.processed).length;

      logger.info(
        { totalAssociations: results.length, processedAssociations, totalBreached, totalAtRisk },
        'POST /api/cron/dsar-sla - DSAR SLA check completed',
      );

      return res.json({
        success: true,
        message: 'DSAR SLA check completed',
        summary: {
          totalAssociations: results.length,
          processedAssociations,
          totalBreached,
          totalAtRisk,
        },
        results,
      });
    } catch (error) {
      logger.error({ error }, 'POST /api/cron/dsar-sla - Unhandled error');
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }),
];

// POST /api/cron/anonymize
// Description: Trigger user data anonymization (cron job)
// Security: Bearer token (CRON_SECRET)

export const postAnonymize: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('POST /api/cron/anonymize - Request started');

      if (!verifyCronSecret(req)) {
        logger.warn('POST /api/cron/anonymize - Unauthorized access attempt');
        return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
      }

      const results = await runAnonymizeCron();
      const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
      const processedAssociations = results.filter((r) => r.processed && !r.error).length;

      logger.info(
        {
          totalAssociations: results.length,
          processedAssociations,
          totalAnonymized: totalProcessed,
          totalFailed,
        },
        'POST /api/cron/anonymize - Anonymization completed',
      );

      return res.json({
        success: true,
        message: 'User anonymization completed',
        summary: {
          totalAssociations: results.length,
          processedAssociations,
          totalAnonymized: totalProcessed,
          totalFailed,
        },
        results,
      });
    } catch (error) {
      logger.error({ error }, 'POST /api/cron/anonymize - Unhandled error');
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }),
];
