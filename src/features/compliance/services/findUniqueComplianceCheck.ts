import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.ComplianceCheckWhereInput;
};

export async function findUniqueComplianceCheck({ where }: Props) {
  return await prisma.complianceCheck.findFirst({ where });
}
