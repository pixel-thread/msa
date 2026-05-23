import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";

export const GET = withAssociation({}, async (association, _, request) => {
  await withRole(request, UserRole.MEMBER);
  const userId = request.headers.get("x-user-id")!;

  const meetings = await prisma.meeting.findMany({
    where: {
      associationId: association.id,
      attendees: {
        some: {
          userId,
        },
      },
    },
    include: {
      attendees: {
        where: { userId },
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  return SuccessResponse({ data: meetings });
});
