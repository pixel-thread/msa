import { prisma } from '@lib/prisma';

/** Props for creating an agenda item. */
type Props = {
  meetingId: string;
  title: string;
  description?: string;
  order: number;
};

/** Create a new agenda item for a meeting. */
export async function createAgendaItem({ meetingId, title, description, order }: Props) {
  return await prisma.agendaItem.create({
    data: { meetingId, title, description, order },
  });
}
