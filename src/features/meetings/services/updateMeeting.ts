import 'server-only';
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';
import { MeetingStatus } from '@prisma/client';

interface UpdateMeetingProps {
  meetingId: string;
  associationId: string;
  data: {
    title?: string;
    type?: import('@prisma/client').MeetingType;
    scheduledAt?: Date;
    venue?: string;
    status?: MeetingStatus;
    noticeIssuedAt?: Date;
  };
}

export async function updateMeeting({ meetingId, associationId, data }: UpdateMeetingProps) {
  const existing = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!existing) {
    throw new NotFoundError('Meeting');
  }

  return await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      ...data,
      ...(data.scheduledAt && { scheduledAt: data.scheduledAt }),
    },
  });
}
