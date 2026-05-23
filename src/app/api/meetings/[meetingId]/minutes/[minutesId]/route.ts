import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import {
  deleteMeetingMinute,
  updateMeetingMinute,
} from "@feature/meetings/services/minutes";
import { UpdateMeetingMinuteSchema } from "@feature/meetings/validators/minutes";
import { z } from "zod";

const ParamsSchema = z.object({
  meetingId: z.uuid("Invalid meeting ID"),
  minutesId: z.uuid("Invalid minute ID"),
});

export const PATCH = withAssociation(
  { params: ParamsSchema, body: UpdateMeetingMinuteSchema },
  async (association, { params, body }, request) => {
    // Check for administrative roles (Secretary and above)
    await withRole(request, UserRole.SECRETARY);

    const minute = await updateMeetingMinute({
      meetingId: params!.meetingId,
      minuteId: params!.minutesId,
      associationId: association.id,
      data: body!,
    });

    return SuccessResponse({
      data: minute,
      message: "Meeting minute updated successfully",
    });
  },
);

export const DELETE = withAssociation(
  { params: ParamsSchema },
  async (_association, { params }, request) => {
    // Check for administrative roles (Secretary and above)
    await withRole(request, UserRole.SECRETARY);

    const deletedMinute = await deleteMeetingMinute({
      where: {
        id: params!.minutesId,
        meetingId: params!.meetingId,
      },
    });

    return SuccessResponse({
      data: deletedMinute,
      message: "Meeting minute deleted successfully",
    });
  },
);
