/**
 * @file Find First Association Service
 * @description This service retrieves the first association matching the given criteria.
 */

import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Parameters for finding the first matching association.
 */
type Props = {
  /** The search criteria. */
  where: Prisma.AssociationWhereInput;
  /** Optional number of records to skip. */
  take?: number;
  /** Optional selection of fields. */
  select?: Prisma.AssociationSelect;
};

/**
 * Find the first association matching the given criteria.
 *
 * @param props - The search properties.
 * @returns The matching association record or null if not found.
 */
export async function findFirstAssociation(props: Props) {
  // Retrieve the first match from Prisma
  const association = await prisma.association.findFirst(props);

  return association;
}
