import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  data: Prisma.ComplianceCheckCreateManyInput[];
};

export async function createBulkComplianceChecks({ data }: Props) {
  return await prisma.complianceCheck.createMany({ data });
}
