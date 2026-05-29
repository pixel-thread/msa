import 'server-only';
import { prisma } from '@lib/prisma';

type Props = {
  meetingId: string;
  title: string;
  description?: string;
  order: number;
};

export async function createAgendaItem({ meetingId, title, description, order }: Props) {
  return await prisma.agendaItem.create({
    data: { meetingId, title, description, order },
  });
}
