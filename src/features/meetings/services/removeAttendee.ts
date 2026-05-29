import 'server-only';
import { prisma } from '@lib/prisma';
import { NotFoundError, ForbiddenError } from '@src/shared/errors';

interface RemoveAttendeeProps {
  meetingId: string;
  associationId: string;
  userId: string;
}

export async function removeAttendee({ meetingId, associationId, userId }: RemoveAttendeeProps) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) {
    throw new NotFoundError('Meeting');
  }

  const attendance = await prisma.meetingAttendee.findUnique({
    where: {
      meetingId_userId: {
        meetingId,
        userId,
      },
    },
  });

  if (!attendance) {
    throw new ForbiddenError('User is not assigned to this meeting');
  }

  await prisma.meetingAttendee.delete({
    where: {
      meetingId_userId: {
        meetingId,
        userId,
      },
    },
  });

  return { success: true };
}
