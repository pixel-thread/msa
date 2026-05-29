import 'server-only';
import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

type Props = {
  where: Prisma.AssociationWhereInput;
  take?: number;
  select?: Prisma.AssociationSelect;
};

export async function findFirstAssociation(props: Props) {
  return await prisma.association.findFirst(props);
}
