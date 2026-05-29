import 'server-only';
import { prisma } from '@lib/prisma';

type Props = {
  where: { id: string };
};

export async function deleteAgendaItem({ where }: Props) {
  return await prisma.agendaItem.delete({ where });
}
