import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Props for fetching a single compliance check. */
type Props = {
  /** Filter criteria to find the check. */
  where: Prisma.ComplianceCheckWhereInput;
};

/** Find the first compliance check matching the given criteria. */
export async function findUniqueComplianceCheck({ where }: Props) {
  return await prisma.complianceCheck.findFirst({ where });
}
