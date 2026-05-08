import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { updateAttendee } from "@feature/meetings/services";
import { UpdateAttendeeSchema } from "@feature/meetings/validators/attendee";
import { z } from "zod";
import { NextRequest } from "next/server";

const AttendeeParamsSchema = z.object({
  meetingId: z.string().uuid("Invalid meeting ID"),
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

    const userId = request.headers.get("x-user-id")!;
    const user = await withRole(
      request as unknown as NextRequest,
      UserRole.MEMBER,
    );

    if (!user) {
      throw new ForbiddenError("User not found");
    }

    const updated = await updateAttendee({
      meetingId: params.meetingId,
      associationId: association.id,
      userId: user.id,
      data: { ...body },
      isAdminUpdate: false,
    });

    return SuccessResponse({ data: updated });
  },
);