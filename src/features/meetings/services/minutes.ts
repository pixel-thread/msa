import { prisma } from "@src/shared/lib/prisma";
import { NotFoundError } from "@src/shared/errors";
import { CreateMeetingMinuteInput, UpdateMeetingMinuteInput } from "../validators/minutes";

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

export async function createMeetingMinute({ meetingId, associationId, data }: CreateMeetingMinuteProps) {
  // Stub
}

export async function updateMeetingMinute({ meetingId, minuteId, associationId, data }: UpdateMeetingMinuteProps) {
  // Stub
}
