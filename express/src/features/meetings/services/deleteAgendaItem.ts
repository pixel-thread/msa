import { prisma } from '@lib/prisma';

/** Props for deleting an agenda item. */
type Props = {
  where: { id: string };
};

/** Delete an agenda item by ID. */
export async function deleteAgendaItem({ where }: Props) {
  return await prisma.agendaItem.delete({ where });
}
