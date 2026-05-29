import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';

type Props = {
  where: Prisma.ComplianceCheckWhereInput;
  page?: number;
};

export async function findManyComplianceChecks({ where, page = 1 }: Props) {
  const skip = (page - 1) * PAGE_SIZE;
  const [checks, total] = await Promise.all([
    prisma.complianceCheck.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.complianceCheck.count({ where }),
  ]);
  return { checks, total };
}
