/**
 * @file Create Association Service
 * @description This service handles the creation of new association records.
 */

import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Parameters for creating an association.
 */
type CreateAssociationProps = {
  /** The data required to create the association. */
  data: Prisma.AssociationCreateInput;
};

/**
 * Create a new association in the database.
 *
 * @param props - The creation properties.
 * @returns The created association record.
 */
export async function createAssociation({ data }: CreateAssociationProps) {
  // Create association using Prisma
  const association = await prisma.association.create({ data });

  return association;
}
