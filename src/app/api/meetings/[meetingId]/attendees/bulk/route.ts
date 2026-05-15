import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { AssignAttendeesSchema } from "@src/features/meetings/validators/attendee";
import { assignAttendees } from "@src/features/meetings/services/assignAttendee";
import { ForbiddenError } from "@src/shared/errors";

export const POST = withAssociation(
  { body: AssignAttendeesSchema },
  async (association, { body }, request, { params }) => {
    await withRole(request, UserRole.SECRETARY);
    
    if (!body) {
      throw new ForbiddenError("Invalid body");
    }

    const { meetingId } = (await params) as { meetingId: string };

    await assignAttendees(meetingId, association.id, body.attendees);

    return SuccessResponse({ message: "Bulk assignment successful" });
  }
);
