import 'server-only';
import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';
import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils';

type FindManyProps = {
  where?: Prisma.AssociationWhereInput;
  orderBy?: Prisma.AssociationOrderByWithRelationInput;
  page?: number;
};
export async function findManyAssociation({ page = 1, where, orderBy }: FindManyProps) {
  const [associations, total] = await prisma.$transaction([
    prisma.association.findMany({
      where,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      orderBy,
    }),
    prisma.association.count({ where }),
  ]);

  return {
    associations,
    pagination: buildPagination(total, page),
  };
}
