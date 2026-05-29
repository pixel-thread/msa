import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.AssociationWhereUniqueInput;
};

export async function findUniqueAssociation(prosp: Props) {
  return await prisma.association.findUnique(prosp);
}
