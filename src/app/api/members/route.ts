import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import { prisma } from "@src/shared/lib/prisma";
import { UserRole } from "@prisma/client";
import { withRole } from "@src/shared/api/with-role";

export const GET = withAssociation({}, async (association, {}, request) => {
  await withRole(request, UserRole.MEMBER);

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
  });

  return SuccessResponse({
    data: members,
  });
});
