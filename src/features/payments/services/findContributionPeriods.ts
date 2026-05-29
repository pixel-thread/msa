import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';

type Props = {
  where: Prisma.ContributionPeriodWhereInput;
  page?: number;
  pageSize?: number;
  include?: Prisma.ContributionPeriodInclude;
};

export async function findContributionPeriods({ where, page = 1, pageSize = PAGE_SIZE, include }: Props) {
  const skip = (page - 1) * pageSize;
  const [contributions, total] = await Promise.all([
    prisma.contributionPeriod.findMany({
      where,
      include,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: pageSize,
      skip,
    }),
    prisma.contributionPeriod.count({ where }),
  ]);
  return { contributions, total };
}
