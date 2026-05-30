import 'server-only';
import { prisma } from '@lib/prisma';

interface FindManyMemberTypesProps {
  associationId: string;
}

export async function findManyMemberTypes({ associationId }: FindManyMemberTypesProps) {
  return await prisma.memberType.findMany({
    where: { associationId },
    orderBy: { level: 'asc' },
    include: {
      _count: {
        select: { users: true, subscriptionPlans: true },
      },
    },
  });
}
