import { prisma } from "@lib/prisma";
import { Prisma } from "@prisma/client";

type FindManyProps = {
  where?: Prisma.AssociationWhereInput;
  orderBy?: Prisma.AssociationOrderByWithRelationInput;
  take?: number;
};
export async function findManyAssociation(props: FindManyProps = {}) {
  return await prisma.association.findMany(props);
}
