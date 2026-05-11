import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import { prisma } from "@src/shared/lib/prisma";
import { UserRole } from "@prisma/client";
import { withRole } from "@src/shared/api/with-role";
import { buildPagination } from "@src/shared/utils/build-pagination";

export const GET = withAssociation({}, async (association, {}, request) => {
  await withRole(request, UserRole.MEMBER);
  const page = 10;
  const limit = 10;
  const take = 10;
  const skip = page / take;

  const members = await prisma.user.findMany({
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
    take,
    skip,
  });

  return SuccessResponse({
    data: members,
    meta: buildPagination(100, page, limit),
  });
});
