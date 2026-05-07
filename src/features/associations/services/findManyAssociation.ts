import { prisma } from "@lib/prisma";

export async function findManyAssociation() {
  return prisma.association.findMany();
}
