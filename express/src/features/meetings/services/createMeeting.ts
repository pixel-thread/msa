import { prisma } from '@lib/prisma';
import { MeetingType, MeetingStatus } from '@prisma/client';

/** Agenda item data for meeting creation. */
interface AgendaItemData {
  order: number;
  title: string;
  description?: string;
}

/** Props for creating a meeting. */
interface CreateMeetingProps {
  associationId: string;
  createdById: string;
  data: {
    title: string;
    type: MeetingType;
    scheduledAt: Date;
    venue?: string;
    agendaItems: AgendaItemData[];
  };
}

/** Create a new meeting with agenda items. */
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
      agendaItems: {
        create: data.agendaItems.map((item) => ({
          order: item.order,
          title: item.title,
          description: item.description,
        })),
      },
    },
  });
}
