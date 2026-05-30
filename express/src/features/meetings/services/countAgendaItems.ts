import { prisma } from '@lib/prisma';

/** Props for counting agenda items. */
type Props = {
  meetingId: string;
};

/** Count the number of agenda items for a meeting. */
export async function countAgendaItems({ meetingId }: Props) {
  return await prisma.agendaItem.count({ where: { meetingId } });
}
