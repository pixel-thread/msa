import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Parameters for finding a unique association. */
type Props = {
  where: Prisma.AssociationWhereUniqueInput;
};

/** Find a single association by unique criteria. */
export async function findUniqueAssociation(prosp: Props) {
  return await prisma.association.findUnique(prosp);
}
