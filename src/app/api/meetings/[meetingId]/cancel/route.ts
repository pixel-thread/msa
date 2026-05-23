import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole, MeetingStatus } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { hasHighRoleAccess } from "@src/shared/utils/has-high-role";
import { ForbiddenError } from "@src/shared/errors";

export const POST = withAssociation({}, async (association, _, request, { params }) => {
  const user = await withRole(request, UserRole.PRESIDENT);

  if (!hasHighRoleAccess(user.role)) {
    throw new ForbiddenError("Only president or super admin can cancel meetings");
  }

  const { meetingId } = (await params) as { meetingId: string };

  const meeting = await prisma.meeting.update({
    where: {
      id: meetingId,
      associationId: association.id,
    },
    data: {
      status: MeetingStatus.CANCELLED,
    },
  });

  return SuccessResponse({ data: meeting });
});
