import { NotificationType } from "@prisma/client";
import z from "zod";

export const CreateNotificationSchema = z.object({
  userId: z.uuid(),
  title: z.string(),
  type: z.enum(NotificationType),
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
