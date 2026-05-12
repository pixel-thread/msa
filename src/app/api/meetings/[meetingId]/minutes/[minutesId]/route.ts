import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { updateMeetingMinute } from "@feature/meetings/services/minutes";
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
