import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';

/** Props for fetching compliance checks with pagination. */
type Props = {
  /** Filter criteria. */
  where: Prisma.ComplianceCheckWhereInput;
  /** Page number (defaults to 1). */
  page?: number;
};

/** Find compliance checks with pagination. Returns checks and total count. */
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
