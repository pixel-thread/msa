import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findUniqueMeeting,
  assignAttendee,
  bulkAssignAttendees,
} from "@feature/meetings/services";

import {
  AssignAttendeeSchema,
  BulkAssignAttendeesSchema,
  MeetingQuerySchema,
} from "@feature/meetings/validators";
import { z } from "zod";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";

const MeetingParamsSchema = z.object({
  meetingId: z.string("Invalid meeting ID"),
});

export const GET = withAssociation(
  { params: MeetingParamsSchema, query: MeetingQuerySchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }

    const user = await withRole(request, UserRole.MEMBER);

    const meeting = await findUniqueMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    if (!hasHighRoleAccess(user.role)) {
      const myAttendance = meeting.attendees.find(
        (a: { user: { id: string } }) => a.user.id === user.id,
      );
      if (!myAttendance) {
        throw new ForbiddenError("You are not assigned to this meeting");
      }
    }

    return SuccessResponse({
      data: meeting.attendees,
      meta: { total: meeting.attendees.length },
    });
  },
);

export const POST = withAssociation(
  { params: MeetingParamsSchema, body: AssignAttendeeSchema },
  async (association, { params, body }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError(
        "Only secretary, president, or super admin can assign attendees",
      );
    }

    const attendee = await assignAttendee({
      meetingId: params.meetingId,
      associationId: association.id,
      userId: body.userId,
      attendeeRole: body.attendeeRole,
    });

    return SuccessResponse({ data: attendee }, 201);
  },
);

export const PUT = withAssociation(
  { params: MeetingParamsSchema, body: BulkAssignAttendeesSchema },
  async (association, { params, body }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }

    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError(
        "Only secretary, president, or super admin can bulk assign attendees",
      );
    }

    const result = await bulkAssignAttendees({
      meetingId: params.meetingId,
      associationId: association.id,
      userIds: body.userIds,
      attendeeRole: body.attendeeRole,
    });

    return SuccessResponse({
      data: result,
      message: `Assigned ${result.assigned.length} attendees, skipped ${result.skipped.length} existing`,
    });
  },
);
