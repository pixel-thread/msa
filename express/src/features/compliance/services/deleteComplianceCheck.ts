import { prisma } from '@src/shared/lib/prisma';

/** Props for deleting a compliance check. */
type Props = {
  /** The unique identifier of the check to delete. */
  where: { id: string };
};

/** Delete a single compliance check by its ID. */
export async function deleteComplianceCheck({ where }: Props) {
  return await prisma.complianceCheck.delete({ where });
}
