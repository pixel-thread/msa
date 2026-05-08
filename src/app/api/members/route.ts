import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import { prisma } from "@src/shared/lib/prisma";
import { UserRole } from "@prisma/client";
import { withRole } from "@src/shared/api/with-role";
import { NextRequest } from "next/server";

// const QuerySchema = z.object({
//   page: z.coerce
//     .number({ message: "Page must be a number" })
//     .int({ message: "Page must be an integer" })
//     .positive({ message: "Page must be a positive number" })
//     .default(1),
//   limit: z.coerce
//     .number({ message: "Limit must be a number" })
//     .int({ message: "Limit must be an integer" })
//     .positive({ message: "Limit must be a positive number" })
//     .default(5),
// });

export const GET = withAssociation({}, async (association, {}, request) => {
  await withRole(request as unknown as NextRequest, UserRole.MEMBER);

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

