import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.ContributionPeriodWhereInput;
  include?: Prisma.ContributionPeriodInclude;
};

export async function findUniqueContributionPeriod({ where, include }: Props) {
  return await prisma.contributionPeriod.findFirst({ where, include });
}
