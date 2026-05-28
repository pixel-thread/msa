import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { ForbiddenError } from "@src/shared/errors";
import { BulkAssignAttendeesSchema } from "@src/features/meetings";
import { bulkAssignAttendees } from "@src/features/meetings/services/bulkAssignAttendees";
import { logger } from "@src/shared/logger";

export const POST = withAssociation(
  { body: BulkAssignAttendeesSchema },
  async (association, { body, traceId }, request, { params }) => {
    logger.info("POST /api/meetings/[meetingId]/attendees/bulk - Request started", { traceId, associationId: association.id });

    const user = await withRole(request, UserRole.SECRETARY);

    if (!body) {
      throw new ForbiddenError("Invalid body");
    }

    const { meetingId } = (await params) as { meetingId: string };

    logger.info("POST /api/meetings/[meetingId]/attendees/bulk - User authorized", { traceId, userId: user.id, role: user.role, meetingId });

    logger.info("POST /api/meetings/[meetingId]/attendees/bulk - Bulk assigning attendees", { traceId, meetingId });

    await bulkAssignAttendees({
      meetingId,
      associationId: association.id,
      userIds: body.userIds,
    });

    logger.info("POST /api/meetings/[meetingId]/attendees/bulk - Success", { traceId, meetingId });

    return SuccessResponse({
      data: null,
      message: "Bulk assignment successful",
    });
  },
);
