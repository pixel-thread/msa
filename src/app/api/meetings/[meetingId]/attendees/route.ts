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
import { NextRequest } from "next/server";

const HIGH_ROLE_USERS: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.PRESIDENT,
  UserRole.SECRETARY,
];

const MeetingParamsSchema = z.object({
  meetingId: z.string("Invalid meeting ID"),
});

export const GET = withAssociation(
  { params: MeetingParamsSchema, query: MeetingQuerySchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }

    const user = await withRole(
      request as unknown as NextRequest,
      UserRole.MEMBER,
    );

    const meeting = await findUniqueMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    if (!HIGH_ROLE_USERS.includes(user.role)) {
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

    const user = await withRole(
      request as unknown as NextRequest,
      UserRole.SECRETARY,
    );

    if (!HIGH_ROLE_USERS.includes(user.role)) {
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

    const user = await withRole(
      request as unknown as NextRequest,
      UserRole.SECRETARY,
    );

    if (!HIGH_ROLE_USERS.includes(user.role)) {
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
