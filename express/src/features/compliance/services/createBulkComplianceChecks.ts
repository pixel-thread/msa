import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Props for creating bulk compliance checks. */
type Props = {
  /** The array of compliance check data to create. */
  data: Prisma.ComplianceCheckCreateManyInput[];
};

/** Create multiple compliance check records in bulk. */
export async function createBulkComplianceChecks({ data }: Props) {
  return await prisma.complianceCheck.createMany({ data });
}
