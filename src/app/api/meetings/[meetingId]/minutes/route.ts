import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import {
  createMeetingMinute,
  getMeetingMinuites,
} from "@feature/meetings/services/minutes";
import { CreateMeetingMinuteSchema } from "@feature/meetings/validators/minutes";
import { z } from "zod";

const ParamsSchema = z.object({
  meetingId: z.uuid("Invalid meeting ID"),
});

export const GET = withAssociation(
  { params: ParamsSchema },
  async (_association, { params }, req) => {
    await withRole(req, UserRole.MEMBER);

    const minuites = await getMeetingMinuites({
      where: { meetingId: params?.meetingId },
    });

    return SuccessResponse({
      data: minuites,
      message: "Meeting minuites fetch successfully",
    });
  },
);

export const POST = withAssociation(
  { params: ParamsSchema, body: CreateMeetingMinuteSchema },
  async (association, { params, body }, request) => {
    // Check for administrative roles (Secretary and above)
    await withRole(request, UserRole.SECRETARY);

    const minute = await createMeetingMinute({
      meetingId: params!.meetingId,
      associationId: association.id,
      data: body!,
    });

    return SuccessResponse({
      data: minute,
      message: "Meeting minute recorded successfully",
    });
  },
);
