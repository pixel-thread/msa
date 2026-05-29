import 'server-only';
import { prisma } from '@lib/prisma';

type Props = {
  meetingId: string;
};

export async function countAgendaItems({ meetingId }: Props) {
  return await prisma.agendaItem.count({ where: { meetingId } });
}
