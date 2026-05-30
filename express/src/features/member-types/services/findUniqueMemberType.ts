import { prisma } from '@lib/prisma';

/** Parameters for finding a unique member type. */
interface FindUniqueMemberTypeProps {
  associationId: string;
  memberTypeId: string;
}

/** Find a single member type by ID within a specific association. */
export async function findUniqueMemberType({
  associationId,
  memberTypeId,
}: FindUniqueMemberTypeProps) {
  return await prisma.memberType.findFirst({
    where: { id: memberTypeId, associationId },
    include: {
      _count: {
        select: { users: true, subscriptionPlans: true },
      },
    },
  });
}
