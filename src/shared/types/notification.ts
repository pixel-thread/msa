export type { NotificationType } from './enums';
export { NOTIFICATION_TYPE_VALUES } from './enums';

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
