import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { NotFoundError } from "@src/shared/errors";

export const GET = withAssociation({}, async (association, _, request, { params }) => {
  await withRole(request, UserRole.SECRETARY);

  const { meetingId } = (await params) as { meetingId: string };

  const meeting = await prisma.meeting.findUnique({
    where: {
      id: meetingId,
      associationId: association.id,
    },
    include: {
      attendees: {
        include: { user: true },
      },
      agendaItems: true,
      minutes: true,
    },
  });

  if (!meeting) {
    throw new NotFoundError("Meeting not found");
  }

  return SuccessResponse({ data: meeting });
});
