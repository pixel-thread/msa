import { NOTIFICATION_TYPE_VALUES } from '@src/shared/types';
import z from 'zod';

export const CreateNotificationSchema = z.object({
  userId: z.uuid(),
  title: z.string(),
  type: z.enum(NOTIFICATION_TYPE_VALUES),
  route: z.string(),
  entiryId: z.string(),
  imageUrl: z.string().optional(),
  isRead: z.boolean().optional(),
  readAt: z.coerce.date().optional(),
  isReceived: z.boolean().optional(),
  receivedAt: z.coerce.date().optional(),
  meta: z.json(),
});

export const UpdateNotificationSchema = CreateNotificationSchema.partial();

export const NotificationRouteParams = z.object({
  notificationId: z.uuid(),
});
