import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { ForbiddenError } from "@src/shared/errors";
import { BulkAssignAttendeesSchema } from "@src/features/meetings";
import { bulkAssignAttendees } from "@src/features/meetings/services/bulkAssignAttendees";

export const POST = withAssociation(
  { body: BulkAssignAttendeesSchema },
  async (association, { body }, request, { params }) => {
    await withRole(request, UserRole.SECRETARY);

    if (!body) {
      throw new ForbiddenError("Invalid body");
    }

    const { meetingId } = (await params) as { meetingId: string };

    await bulkAssignAttendees({
      meetingId,
      associationId: association.id,
      userIds: body.userIds,
    });

    return SuccessResponse({
      data: null,
      message: "Bulk assignment successful",
    });
  },
);
