import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findUniqueMeeting,
  updateMeeting,
  deleteMeeting,
} from "@feature/meetings/services";
import { UpdateMeetingSchema } from "@feature/meetings/validators/meetings";
import { z } from "zod";

const HIGH_ROLE_USERS: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.PRESIDENT,
  UserRole.SECRETARY,
];

const MeetingParamsSchema = z.object({
  meetingId: z.string("Invalid meeting ID"),
});

export const GET = withAssociation(
  { params: MeetingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }

    const user = await withRole(request, UserRole.MEMBER);
    const userId = request.headers.get("x-user-id")!;

    const meeting = await findUniqueMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    if (!HIGH_ROLE_USERS.includes(user.role)) {
      const isAttendee = meeting.attendees.some(
        (a: { user: { id: string } }) => a.user.id === userId,
      );
      if (!isAttendee) {
        throw new ForbiddenError("You are not assigned to this meeting");
      }
    }

    return SuccessResponse({
      data: meeting,
    });
  },
);

export const PATCH = withAssociation(
  { params: MeetingParamsSchema, body: UpdateMeetingSchema },
  async (association, { params, body }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!HIGH_ROLE_USERS.includes(user.role)) {
      throw new ForbiddenError(
        "Only secretary, president, or super admin can update meetings",
      );
    }

    const updateData: Record<string, unknown> = { ...body };
    if (body?.scheduledAt) {
      updateData.scheduledAt = new Date(body.scheduledAt);
    }

    const meeting = await updateMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
      data: updateData as Parameters<typeof updateMeeting>[0]["data"],
    });

    return SuccessResponse({ data: meeting });
  },
);

export const DELETE = withAssociation(
  { params: MeetingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!HIGH_ROLE_USERS.includes(user.role)) {
      throw new ForbiddenError(
        "Only secretary, president, or super admin can delete meetings",
      );
    }

    const deletedMeeting = await deleteMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    return SuccessResponse({
      data: deletedMeeting,
      message: "Meeting deleted successfully",
    });
  },
);
