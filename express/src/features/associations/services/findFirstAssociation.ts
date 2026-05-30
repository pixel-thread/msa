import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

/** Parameters for finding the first matching association. */
type Props = {
  where: Prisma.AssociationWhereInput;
  take?: number;
  select?: Prisma.AssociationSelect;
};

/** Find the first association matching the given criteria. */
export async function findFirstAssociation(props: Props) {
  return await prisma.association.findFirst(props);
}
