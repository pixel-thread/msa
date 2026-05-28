import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { updateAttendee, removeAttendee } from "@feature/meetings/services";
import { UpdateAttendeeSchema } from "@feature/meetings";
import { z } from "zod";
import { hasHighRoleAccess } from "@src/shared/utils/has-high-role";
import { logger } from "@src/shared/logger";

const AttendeeParamsSchema = z.object({
  meetingId: z.uuid("Invalid meeting ID"),
  userId: z.uuid("Invalid user ID"),
});

export const PATCH = withAssociation(
  { params: AttendeeParamsSchema, body: UpdateAttendeeSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info("PATCH /api/meetings/[meetingId]/attendees/[userId] - Request started", { traceId, meetingId: params?.meetingId, targetUserId: params?.userId, associationId: association.id });

    if (!params) {
      throw new ForbiddenError("Invalid parameters");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const user = await withRole(request, UserRole.MEMBER);
    const requestingUserId = request.headers.get("x-user-id")!;

    logger.info("PATCH /api/meetings/[meetingId]/attendees/[userId] - User authorized", { traceId, userId: user.id, role: user.role, meetingId: params.meetingId, targetUserId: params.userId });

    const isAdmin = hasHighRoleAccess(user.role);
    const isSelfUpdate = params.userId === requestingUserId;

    if (!isAdmin && !isSelfUpdate) {
      throw new ForbiddenError("You can only update your own RSVP");
    }

    logger.info("PATCH /api/meetings/[meetingId]/attendees/[userId] - Updating attendee", { traceId, meetingId: params.meetingId, targetUserId: params.userId });

    const updated = await updateAttendee({
      meetingId: params.meetingId,
      associationId: association.id,
      userId: params.userId,
      data: body,
      isAdminUpdate: isAdmin,
    });

    logger.info("PATCH /api/meetings/[meetingId]/attendees/[userId] - Success", { traceId, meetingId: params.meetingId, targetUserId: params.userId });

    return SuccessResponse({ data: updated });
  },
);

export const DELETE = withAssociation(
  { params: AttendeeParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info("DELETE /api/meetings/[meetingId]/attendees/[userId] - Request started", { traceId, meetingId: params?.meetingId, targetUserId: params?.userId, associationId: association.id });

    if (!params) {
      throw new ForbiddenError("Invalid parameters");
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError(
        "Only secretary, president, or super admin can remove attendees",
      );
    }

    logger.info("DELETE /api/meetings/[meetingId]/attendees/[userId] - User authorized", { traceId, userId: user.id, role: user.role, meetingId: params.meetingId, targetUserId: params.userId });

    logger.info("DELETE /api/meetings/[meetingId]/attendees/[userId] - Removing attendee", { traceId, meetingId: params.meetingId, targetUserId: params.userId });

    await removeAttendee({
      meetingId: params.meetingId,
      associationId: association.id,
      userId: params.userId,
    });

    logger.info("DELETE /api/meetings/[meetingId]/attendees/[userId] - Success", { traceId, meetingId: params.meetingId, targetUserId: params.userId });

    return SuccessResponse({
      data: { success: true },
      message: "Attendee removed successfully",
    });
  },
);
