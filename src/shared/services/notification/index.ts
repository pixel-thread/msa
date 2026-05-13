import { Prisma } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";

type Props = {
  data: Prisma.NotificationUncheckedCreateInput;
};

export async function createNotification({ data }: Props) {
  return prisma.notification.create({ data });
}
