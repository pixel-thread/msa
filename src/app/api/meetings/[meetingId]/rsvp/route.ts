import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError, ValidationError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";

const AttendeeParamsSchema = z.object({
  meetingId: z.uuid("Invalid meeting ID"),
});

const RsvpSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
  note: z
    .string()
    .max(300)
    .optional()
    .transform((v) => v?.trim()),
});

export const POST = withAssociation(
  { params: AttendeeParamsSchema, body: RsvpSchema },
  async (_association, { params, body }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid parameters");
    }

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    await withRole(request, UserRole.MEMBER);

    // Member submitting own RSVP
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      throw new ForbiddenError("Unauthorized");
    }

    const updated = await prisma.meetingAttendee.update({
      where: {
        meetingId_userId: {
          meetingId: params.meetingId,
          userId: userId,
        },
      },
      data: {
        rsvpStatus: body.status,
        rsvpNote: body.note,
        rsvpAt: new Date(),
      },
    });

    return SuccessResponse({
      data: updated,
      message: "RSVP submitted successfully",
    });
  },
);
