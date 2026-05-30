import { Request, Response, NextFunction } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError, ValidationError, NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { upsertPushToken } from '@src/features/notifications/services/upsertPushToken';
import { findUniqueNotification, updateNotificationStatus } from '@src/shared/services/notification';
import { UpdateNotificationSchema, NotificationRouteParams } from '@src/shared/validators/notification';
import { logger } from '@src/shared/logger';
import { withRole } from '@src/features/meetings/routes/_helpers';
import { z } from 'zod';

const RegisterPushTokenSchema = z.object({
  token: z.string(),
});

const LinkNotificationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const postRegisterPushToken = [
  validate({ body: RegisterPushTokenSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      logger.info({ traceId }, 'POST /api/notifications/register - Request started');
      const token = req.body?.token;
      if (!token) throw new ValidationError('Missing token');
      const pushToken = await upsertPushToken(token);
      logger.info({ traceId, tokenId: pushToken.id }, 'POST /api/notifications/register - Success');
      return success(res, { data: pushToken });
    } catch (e) { next(e); }
  },
];

export const postLinkNotification = [
  validate({ body: LinkNotificationSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      logger.info({ traceId }, 'POST /api/notifications/link - Request started');
      const userId = req.headers['x-user-id'];
      if (!userId) throw new UnauthorizedError('User ID is required');
      if (!req.body?.token) throw new ValidationError('Token is required');
      const pushToken = await upsertPushToken(req.body.token, userId as string);
      logger.info({ traceId, tokenId: pushToken.id }, 'POST /api/notifications/link - Success');
      return success(res, { data: pushToken }, 201);
    } catch (e) { next(e); }
  },
];

export const patchNotificationStatus = [
  validate({ body: UpdateNotificationSchema, params: NotificationRouteParams }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      logger.info({ traceId }, 'PATCH /api/notifications/[notificationId]/status - Request started');
      const user = await withRole(req, UserRole.MEMBER);
      logger.info({ traceId, userId: user.id }, 'PATCH /api/notifications/[notificationId]/status - User authorized');
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new UnauthorizedError('Unauthorized');
      const isNotificaitonExist = await findUniqueNotification({
        where: { id: req.params.notificationId, userId },
      });
      if (!isNotificaitonExist) throw new NotFoundError('Notification not found.');
      const payload = {
        isRead: req.body?.isRead,
        isReceived: req.body?.isReceived,
        readAt: req.body?.isRead ? new Date() : null,
        receivedAt: req.body?.isReceived ? new Date() : null,
      };
      const notification = await updateNotificationStatus({
        where: { id: req.params.notificationId },
        data: payload,
      });
      logger.info({ traceId, notificationId: req.params.notificationId }, 'PATCH /api/notifications/[notificationId]/status - Success');
      return success(res, { data: notification, message: 'Successfully updated notification status' });
    } catch (e) { next(e); }
  },
];
