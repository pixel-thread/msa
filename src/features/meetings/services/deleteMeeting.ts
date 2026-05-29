import 'server-only';
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';

interface DeleteMeetingProps {
  meetingId: string;
  associationId: string;
}

export async function deleteMeeting({ meetingId, associationId }: DeleteMeetingProps) {
  const existing = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!existing) {
    throw new NotFoundError('Meeting');
  }

  return await prisma.meeting.delete({
    where: { id: meetingId },
  });
}
