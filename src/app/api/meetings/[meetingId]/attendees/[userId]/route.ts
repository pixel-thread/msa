import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { updateAttendee, removeAttendee } from "@feature/meetings/services";
import { UpdateAttendeeSchema } from "@feature/meetings";
import { z } from "zod";
import { hasHighRoleAccess } from "@src/shared/utils/has-high-role";

const AttendeeParamsSchema = z.object({
  meetingId: z.uuid("Invalid meeting ID"),
  userId: z.uuid("Invalid user ID"),
});

export const PATCH = withAssociation(
  { params: AttendeeParamsSchema, body: UpdateAttendeeSchema },
  async (association, { params, body }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid parameters");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const user = await withRole(request, UserRole.MEMBER);
    const requestingUserId = request.headers.get("x-user-id")!;

    const isAdmin = hasHighRoleAccess(user.role);
    const isSelfUpdate = params.userId === requestingUserId;

    if (!isAdmin && !isSelfUpdate) {
      throw new ForbiddenError("You can only update your own RSVP");
    }

    const updated = await updateAttendee({
      meetingId: params.meetingId,
      associationId: association.id,
      userId: params.userId,
      data: body,
      isAdminUpdate: isAdmin,
    });

    return SuccessResponse({ data: updated });
  },
);

export const DELETE = withAssociation(
  { params: AttendeeParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid parameters");
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError(
        "Only secretary, president, or super admin can remove attendees",
      );
    }

    await removeAttendee({
      meetingId: params.meetingId,
      associationId: association.id,
      userId: params.userId,
    });

    return SuccessResponse({
      data: { success: true },
      message: "Attendee removed successfully",
    });
  },
);
