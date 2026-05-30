/**
 * @file Find Many Associations Service
 * @description This service handles paginated retrieval of association records.
 */

import { prisma } from '@lib/prisma';
import { Prisma } from '@prisma/client';

import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils';

/**
 * Parameters for paginated association lookup.
 */
type FindManyProps = {
  /** Optional search criteria. */
  where?: Prisma.AssociationWhereInput;
  /** Optional ordering criteria. */
  orderBy?: Prisma.AssociationOrderByWithRelationInput;
  /** The page number to retrieve. Defaults to 1. */
  page?: number;
};

/**
 * Find multiple associations with pagination support.
 *
 * @param props - The search and pagination properties.
 * @returns An object containing the association records and pagination metadata.
 */
export async function findManyAssociation({
  page = 1,
  where,
  orderBy,
}: FindManyProps) {
  const skip = (page - 1) * PAGE_SIZE;

  // Fetch matching records and total count in a single transaction
  const [associations, total] = await prisma.$transaction([
    prisma.association.findMany({
      where,
      take: PAGE_SIZE,
      skip,
      orderBy,
    }),
    prisma.association.count({ where }),
  ]);

  return {
    associations,
    pagination: buildPagination(total, page),
  };
}
