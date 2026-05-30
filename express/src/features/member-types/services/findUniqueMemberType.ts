import 'server-only';
import { prisma } from '@lib/prisma';

interface FindUniqueMemberTypeProps {
  associationId: string;
  memberTypeId: string;
}

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
