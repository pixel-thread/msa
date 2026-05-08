import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { createMeetingMinute } from "@feature/meetings/services/minutes";
import { CreateMeetingMinuteSchema } from "@feature/meetings/validators/minutes";
import { z } from "zod";

const ParamsSchema = z.object({ 
  meetingId: z.string().uuid("Invalid meeting ID") 
});

export const POST = withAssociation(
  { params: ParamsSchema, body: CreateMeetingMinuteSchema },
  async (association, { params, body }, request) => {
    // Check for administrative roles (Secretary and above)
    await withRole(request, UserRole.SECRETARY);
    
    const minute = await createMeetingMinute({
      meetingId: params!.meetingId,
      associationId: association.id,
      data: body!
    });

    return SuccessResponse({ 
      data: minute,
      message: "Meeting minute recorded successfully"
    });
  }
);
