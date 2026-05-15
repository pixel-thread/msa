import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole, MeetingStatus } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";

export const POST = withAssociation({}, async (association, _, request, { params }) => {
  await withRole(request, UserRole.SECRETARY);

  const { meetingId } = (await params) as { meetingId: string };

  const meeting = await prisma.meeting.update({
    where: {
      id: meetingId,
      associationId: association.id,
    },
    data: {
      status: MeetingStatus.NOTICE_ISSUED,
      noticeIssuedAt: new Date(),
    },
  });

  return SuccessResponse({ data: meeting });
});
