import { prisma } from "@lib/prisma";
import { Prisma } from "@prisma/client";
import { NotFoundError } from "@src/shared/errors";
import {
  CreateMeetingMinuteInput,
  UpdateMeetingMinuteInput,
} from "../validators/minutes";

interface CreateMeetingMinuteProps {
  meetingId: string;
  associationId: string;
  data: CreateMeetingMinuteInput;
}

interface UpdateMeetingMinuteProps {
  meetingId: string;
  minuteId: string;
  associationId: string;
  data: UpdateMeetingMinuteInput;
}

export async function createMeetingMinute({
  meetingId,
  associationId,
  data,
}: CreateMeetingMinuteProps) {
  // Verify meeting exists and belongs to the association
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });
  if (!meeting) throw new NotFoundError("Meeting");

  return await prisma.meetingMinutes.create({
    data: {
      ...data,
      meetingId,
      // Prisma handles Json fields directly
      actionItems: data.actionItems as Prisma.JsonValue,
    },
  });
}

export async function updateMeetingMinute({
  meetingId,
  minuteId,
  associationId,
  data,
}: UpdateMeetingMinuteProps) {
  // Verify minute exists and is associated with the correct meeting and association
  const minute = await prisma.meetingMinutes.findFirst({
    where: {
      id: minuteId,
      meetingId,
      meeting: { associationId },
    },
  });
  if (!minute) throw new NotFoundError("Meeting Minute");

  return await prisma.meetingMinutes.update({
    where: { id: minuteId },
    data: {
      ...data,
      actionItems: data.actionItems
        ? (data.actionItems as Prisma.JsonValue)
        : undefined,
    },
  });
}
