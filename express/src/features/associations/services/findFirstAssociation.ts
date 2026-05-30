import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parameters for finding the first matching association. */
type Props = {
  where: Prisma.AssociationWhereInput;
  take?: number;
  select?: Prisma.AssociationSelect;
};

// ---------------------------------------------------------------------------
// Find first association
// ---------------------------------------------------------------------------

/** Find the first association matching the given criteria. */
export async function findFirstAssociation(props: Props) {
  return await prisma.association.findFirst(props);
}
