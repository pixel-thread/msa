import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import { prisma } from "@src/shared/lib/prisma";

export const GET = withAssociation(
  { query: null },
  async (association, { query }) => {
    const limit = Math.min(parseInt(query?.limit || "20"), 100);
    const page = parseInt(query?.page || "1");

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where: { associationId: association.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          membershipNumber: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where: { associationId: association.id } }),
    ]);

    return SuccessResponse({
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
);