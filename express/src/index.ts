import express from 'express';
import cookieParser from 'cookie-parser';

import { env } from '@src/env';

import { cors } from './middleware/cors';
import { traceId } from './middleware/trace-id';
import { securityHeaders } from './middleware/security-headers';
import { rateLimiter } from './middleware/rate-limiter';
import { errorHandler } from './middleware/error-handler';

import { logger } from './shared/logger';

import adminRouter from '@feature/admin/routes/index';
import announcementsRouter from '@feature/announcements/routes/index';
import associationsRouter from '@feature/associations/routes/index';
import auditLogsRouter from '@feature/audit-logs/routes/index';
import authRouter from '@feature/auth/routes/index';
import complianceRouter from '@feature/compliance/routes/index';
import consentRouter from '@feature/consent/routes/index';
import cronRouter from '@feature/cron/routes/index';
import dashboardRouter from '@feature/dashboard/routes/index';
import dsarRouter from '@feature/dsar/routes/index';
import healthRouter from '@feature/health/routes/index';
import ledgerRouter from '@feature/ledger/routes/index';
import logsRouter from '@feature/logs/routes/index';
import meetingsRouter from '@feature/meetings/routes/index';
import memberTypesRouter from '@feature/member-types/routes/index';
import membersRouter from '@feature/members/routes/index';
import membershipApplicationsRouter from '@feature/membership-applications/routes/index';
import notificationsRouter from '@feature/notifications/routes/index';
import paymentsRouter from '@feature/payments/routes/index';
import subscriptionsRouter from '@feature/subscriptions/routes/index';
import trainingRouter from '@feature/training/routes/index';
import userRouter from '@feature/user/routes/index';

export function createApp(): express.Express {
  const app = express();

  /**
   * -------------------------------------------------------
   * Global Middleware
   * -------------------------------------------------------
   */

  app.use(cors);
  app.use(traceId);
  app.use(securityHeaders);
  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));
  app.use(rateLimiter);

  /**
   * -------------------------------------------------------
   * Feature Routes
   * -------------------------------------------------------
   */

  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/announcements', announcementsRouter);
  app.use('/api/v1/associations', associationsRouter);
  app.use('/api/v1/audit-logs', auditLogsRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/compliance', complianceRouter);
  app.use('/api/v1/consent', consentRouter);
  app.use('/api/v1/cron', cronRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/dsar', dsarRouter);
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/ledger', ledgerRouter);
  app.use('/api/v1/logs', logsRouter);
  app.use('/api/v1/meetings', meetingsRouter);
  app.use('/api/v1/member-types', memberTypesRouter);
  app.use('/api/v1/members', membersRouter);
  app.use('/api/v1/membership-applications', membershipApplicationsRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/subscriptions', subscriptionsRouter);
  app.use('/api/v1/training', trainingRouter);
  app.use('/api/v1/user', userRouter);

  app.get('/', (_, res) => {
    return res.redirect(`${env.BASE_URL}`);
  });

  /**
   * -------------------------------------------------------
   * 404 Handler
   * -------------------------------------------------------
   */

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  /**
   * -------------------------------------------------------
   * Global Rate Limiter
   * -------------------------------------------------------
   */

  app.use(rateLimiter);

  /**
   * -------------------------------------------------------
   * Global Error Handler
   * -------------------------------------------------------
   */

  app.use(errorHandler);

  return app;
}

const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    logger.debug(`🚀 Express API running on http://localhost:${env.PORT}`);
    logger.debug(`Environment: ${env.NODE_ENV}`);
  });
}

export default app;
