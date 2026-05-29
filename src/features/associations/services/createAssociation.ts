import 'server-only';
import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

type CreateAssociationProps = {
  data: Prisma.AssociationCreateInput;
};

export async function createAssociation({ data }: CreateAssociationProps) {
  return await prisma.association.create({ data });
}
