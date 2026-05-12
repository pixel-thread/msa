import { prisma } from "@src/shared/lib/prisma";
import type { AssociationDetails } from "@src/shared/api/with-association";
import { Prisma } from "@prisma/client";
import { buildPagination } from "@src/shared/utils/build-pagination";

type Props = {
  where: Prisma.UserWhereInput;
  page?: number;
};

export async function getMembers({ where, page = 1 }: Props) {
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where,

      skip,

      take: pageSize,

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        membershipNumber: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    data: members,

    pagination: buildPagination(total, page, pageSize),
  };
}

export async function getMembersByAssociation(association: AssociationDetails) {
  return getMembers({ where: { associationId: association.id } });
}

export async function getMemberCount(associationId: string) {
  const total = await prisma.user.count({
    where: { associationId },
  });

  const active = await prisma.user.count({
    where: { associationId, status: "ACTIVE" },
  });

  return { total, active };
}

