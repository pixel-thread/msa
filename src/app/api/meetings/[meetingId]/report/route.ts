import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { NotFoundError } from "@src/shared/errors";
import { logger } from "@src/shared/logger";

export const GET = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info("GET /api/meetings/[meetingId]/report - Request started", { traceId, associationId: association.id });

  const user = await withRole(request, UserRole.SECRETARY);

  const { meetingId } = (await params) as { meetingId: string };

  logger.info("GET /api/meetings/[meetingId]/report - User authorized", { traceId, userId: user.id, role: user.role, meetingId });

  logger.info("GET /api/meetings/[meetingId]/report - Fetching meeting report", { traceId, meetingId });

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

  logger.info("GET /api/meetings/[meetingId]/report - Success", { traceId, meetingId: meeting.id });

  return SuccessResponse({ data: meeting });
});
