import 'server-only';
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';

interface FindUniqueMeetingProps {
  meetingId: string;
  associationId: string;
}

export async function findUniqueMeeting({ meetingId, associationId }: FindUniqueMeetingProps) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      attendees: {
        orderBy: { attendeeRole: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              membershipNumber: true,
            },
          },
        },
      },
      agendaItems: { orderBy: { order: 'asc' } },
      minutes: { orderBy: { recordedAt: 'desc' } },
    },
  });

  if (!meeting) {
    throw new NotFoundError('Meeting');
  }

  return meeting;
}
