import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.SubscriptionPlanWhereInput;
  include?: Prisma.SubscriptionPlanInclude;
};

export async function findSubscriptionPlans({ where, include }: Props) {
  return await prisma.subscriptionPlan.findMany({
    where,
    include,
    orderBy: { createdAt: 'desc' },
  });
}
