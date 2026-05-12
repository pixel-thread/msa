import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { updateAttendee, removeAttendee } from "@feature/meetings/services";
import { UpdateAttendeeSchema } from "@feature/meetings/validators/attendee";
import { z } from "zod";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";

const AttendeeParamsSchema = z.object({
  meetingId: z.uuid("Invalid meeting ID"),
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

    const isAdmin = hasHighRoleAccess(user.role);

    const isSelfUpdate = user.id === body.userId;

    if (!isSelfUpdate) {
      throw new ForbiddenError("You can only update your own RSVP");
    }

    const updated = await updateAttendee({
      meetingId: params.meetingId,
      associationId: association.id,
      userId: user.id || "",
      data: { ...body },
      isAdminUpdate: isAdmin,
    });

    return SuccessResponse({
      data: updated,
      message: "Successfully updated joining status",
    });
  },
);

export const DELETE = withAssociation(
  { params: AttendeeParamsSchema },
  async (association, { params }, request) => {
    const userId = request.headers.get("x-user-id");
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
      userId: userId || "",
    });

    return SuccessResponse({
      data: { success: true },
      message: "Attendee removed successfully",
    });
  },
);
