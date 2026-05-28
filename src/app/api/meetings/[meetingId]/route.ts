import { withAssociation, withRole } from "@src/shared/api";
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
import { hasHighRoleAccess } from "@src/shared/utils/has-high-role";
import { logger } from "@src/shared/logger";

const MeetingParamsSchema = z.object({
  meetingId: z.string("Invalid meeting ID"),
});

export const GET = withAssociation(
  { params: MeetingParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info("GET /api/meetings/[meetingId] - Request started", { traceId, meetingId: params?.meetingId, associationId: association.id });

    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }

    const user = await withRole(request, UserRole.MEMBER);
    logger.info("GET /api/meetings/[meetingId] - User authorized", { traceId, userId: user.id, role: user.role });

    const userId = request.headers.get("x-user-id")!;

    const meeting = await findUniqueMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    if (!hasHighRoleAccess(user.role)) {
      const isAttendee = meeting.attendees.some(
        (a: { user: { id: string } }) => a.user.id === userId,
      );
      if (!isAttendee) {
        throw new ForbiddenError("You are not assigned to this meeting");
      }
    }

    logger.info("GET /api/meetings/[meetingId] - Success", { traceId, meetingId: meeting.id });

    return SuccessResponse({
      data: meeting,
    });
  },
);

export const PATCH = withAssociation(
  { params: MeetingParamsSchema, body: UpdateMeetingSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info("PATCH /api/meetings/[meetingId] - Request started", { traceId, meetingId: params?.meetingId, associationId: association.id });

    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError(
        "Only secretary, president, or super admin can update meetings",
      );
    }

    logger.info("PATCH /api/meetings/[meetingId] - User authorized", { traceId, userId: user.id, role: user.role, meetingId: params.meetingId });

    logger.info("PATCH /api/meetings/[meetingId] - Updating meeting", { traceId, meetingId: params.meetingId });

    const updateData: Record<string, unknown> = { ...body };
    if (body?.scheduledAt) {
      updateData.scheduledAt = new Date(body.scheduledAt);
    }

    const meeting = await updateMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
      data: updateData as Parameters<typeof updateMeeting>[0]["data"],
    });

    logger.info("PATCH /api/meetings/[meetingId] - Success", { traceId, meetingId: meeting.id });

    return SuccessResponse({ data: meeting });
  },
);

export const DELETE = withAssociation(
  { params: MeetingParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info("DELETE /api/meetings/[meetingId] - Request started", { traceId, meetingId: params?.meetingId, associationId: association.id });

    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }

    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError(
        "Only secretary, president, or super admin can delete meetings",
      );
    }

    logger.info("DELETE /api/meetings/[meetingId] - User authorized", { traceId, userId: user.id, role: user.role, meetingId: params.meetingId });

    logger.info("DELETE /api/meetings/[meetingId] - Deleting meeting", { traceId, meetingId: params.meetingId });

    const deletedMeeting = await deleteMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    logger.info("DELETE /api/meetings/[meetingId] - Success", { traceId, meetingId: deletedMeeting.id });

    return SuccessResponse({
      data: deletedMeeting,
      message: "Meeting deleted successfully",
    });
  },
);
