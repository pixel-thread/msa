/**
 * @file Update Association Service
 * @description This service handles updates to existing association records.
 */

import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Parameters for updating an association.
 */
type Props = {
  /** The unique identifier for the association to update. */
  where: { id: string };
  /** The data to update. */
  data: Prisma.AssociationUpdateInput;
};

/**
 * Update an existing association by ID.
 *
 * @param props - The update properties.
 * @returns The updated association record.
 */
export async function updateAssociation(props: Props) {
  const { where, data } = props;

  // Apply the update via Prisma
  const updated = await prisma.association.update({
    where,
    data,
  });

  return updated;
}
