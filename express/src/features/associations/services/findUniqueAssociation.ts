import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parameters for finding a unique association. */
type Props = {
  where: Prisma.AssociationWhereUniqueInput;
};

// ---------------------------------------------------------------------------
// Find unique association
// ---------------------------------------------------------------------------

/** Find a single association by unique criteria. */
export async function findUniqueAssociation(props: Props) {
  return await prisma.association.findUnique(props);
}
