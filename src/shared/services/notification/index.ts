import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  data: Prisma.NotificationUncheckedCreateInput;
};

export async function createNotification({ data }: Props) {
  return await prisma.notification.create({ data });
}

type UpdateNotificationStatus = {
  where: Prisma.NotificationWhereUniqueInput;
  data: Prisma.NotificationUpdateInput;
};

export async function updateNotificationStatus({ data, where }: UpdateNotificationStatus) {
  return await prisma.notification.update({
    where,
    data,
  });
}

type FindUniqueNotification = {
  where: Prisma.NotificationWhereUniqueInput;
};

export async function findUniqueNotification({ where }: FindUniqueNotification) {
  return await prisma.notification.findUnique({ where });
}
