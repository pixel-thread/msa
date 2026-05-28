import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole, MeetingStatus } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { logger } from "@src/shared/logger";

export const POST = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info("POST /api/meetings/[meetingId]/notice - Request started", { traceId, associationId: association.id });

  const user = await withRole(request, UserRole.SECRETARY);

  const { meetingId } = (await params) as { meetingId: string };

  logger.info("POST /api/meetings/[meetingId]/notice - User authorized", { traceId, userId: user.id, role: user.role, meetingId });

  logger.info("POST /api/meetings/[meetingId]/notice - Issuing notice", { traceId, meetingId });

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

  logger.info("POST /api/meetings/[meetingId]/notice - Success", { traceId, meetingId: meeting.id });

  return SuccessResponse({ data: meeting });
});
