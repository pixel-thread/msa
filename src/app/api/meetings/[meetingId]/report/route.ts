import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { NotFoundError } from "@src/shared/errors";
import { logger } from "@src/shared/logger/server";

export const GET = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info({ traceId, associationId: association.id }, "GET /api/meetings/[meetingId]/report - Request started");

  const user = await withRole(request, UserRole.SECRETARY);

  const { meetingId } = (await params) as { meetingId: string };

  logger.info({ traceId, userId: user.id, role: user.role, meetingId }, "GET /api/meetings/[meetingId]/report - User authorized");

  logger.info({ traceId, meetingId }, "GET /api/meetings/[meetingId]/report - Fetching meeting report");

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

  logger.info({ traceId, meetingId: meeting.id }, "GET /api/meetings/[meetingId]/report - Success");

  return SuccessResponse({ data: meeting });
});
