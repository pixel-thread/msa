/**
 * @file Find Unique Association Service
 * @description This service retrieves a single association by its unique identifier.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/**
 * Parameters for finding a unique association.
 */
type Props = {
  /** The unique search criteria (e.g., ID or slug). */
  where: Prisma.AssociationWhereUniqueInput;
};

/**
 * Find a single association by unique criteria.
 *
 * @param props - The unique search properties.
 * @returns The matching association record or null if not found.
 */
export async function findUniqueAssociation(props: Props) {
  // Retrieve unique record from Prisma
  const association = await prisma.association.findUnique(props);

  return association;
}
