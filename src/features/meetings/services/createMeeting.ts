import { prisma } from "@lib/prisma";
import { MeetingType, MeetingStatus } from "@prisma/client";

interface CreateMeetingProps {
  associationId: string;
  createdById: string;
  data: {
    title: string;
    type: MeetingType;
    scheduledAt: Date;
    venue?: string;
  };
}

export async function createMeeting({ associationId, createdById, data }: CreateMeetingProps) {
  return await prisma.meeting.create({
    data: {
      associationId,
      createdById,
      title: data.title,
      type: data.type,
      scheduledAt: data.scheduledAt,
      venue: data.venue,
      status: MeetingStatus.SCHEDULED,
    },
  });
}