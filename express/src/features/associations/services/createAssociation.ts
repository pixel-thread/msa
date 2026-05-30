import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

/** Parameters for creating an association. */
type CreateAssociationProps = {
  data: Prisma.AssociationCreateInput;
};

/** Create a new association in the database. */
export async function createAssociation({ data }: CreateAssociationProps) {
  return await prisma.association.create({ data });
}
