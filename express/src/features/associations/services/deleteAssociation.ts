/**
 * @file Delete Association Service
 * @description This service handles the soft-deletion of association records.
 */

import { prisma } from '@lib/prisma';

/**
 * Parameters for deleting an association.
 */
type Props = {
  /** The ID of the association to delete. */
  id: string;
};

/**
 * Soft-delete an association by setting its status to DELETED.
 *
 * @param props - The deletion properties.
 * @returns The updated association record.
 */
export async function deleteAssociation(props: Props) {
  // Update status to DELETED (soft delete)
  const deleted = await prisma.association.update({
    where: { id: props.id },
    data: { status: 'DELETED' },
  });

  return deleted;
}
