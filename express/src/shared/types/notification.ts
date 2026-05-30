import type { NotificationType } from './enums';
import { NOTIFICATION_TYPE_VALUES } from './enums';
export type { NotificationType };
export { NOTIFICATION_TYPE_VALUES };

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
