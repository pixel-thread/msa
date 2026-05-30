import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Input for creating a notification. */
type Props = {
  data: Prisma.NotificationUncheckedCreateInput;
};

/** Creates a new notification record. */
export async function createNotification({ data }: Props) {
  return await prisma.notification.create({ data });
}

/** Input for updating a notification's status. */
type UpdateNotificationStatus = {
  where: Prisma.NotificationWhereUniqueInput;
  data: Prisma.NotificationUpdateInput;
};

/** Updates an existing notification's status. */
export async function updateNotificationStatus({ data, where }: UpdateNotificationStatus) {
  return await prisma.notification.update({
    where,
    data,
  });
}

/** Input for finding a notification by unique criteria. */
type FindUniqueNotification = {
  where: Prisma.NotificationWhereUniqueInput;
};

/** Finds a single notification matching the given criteria. */
export async function findUniqueNotification({ where }: FindUniqueNotification) {
  return await prisma.notification.findUnique({ where });
}
