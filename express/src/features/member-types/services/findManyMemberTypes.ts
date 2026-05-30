import { prisma } from '@lib/prisma';

/** Parameters for finding member types. */
interface FindManyMemberTypesProps {
  associationId: string;
}

/** Retrieve all member types for an association, ordered by level ascending. */
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
