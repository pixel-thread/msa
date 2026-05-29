import { $Enums } from '@prisma/client';

export type NotificationType = $Enums.NotificationType;

export interface NotificationDataT {
  id?: string;
  type?: NotificationType;

  title: string;
  body: string;

  route: string;

  entityId?: string;
  userId?: string;

  image?: string;

  createdAt?: string;

  meta?: Record<string, string>;
}
