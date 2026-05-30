import { Prisma } from '@prisma/client';
import { prisma } from '@lib/prisma';

/** Props for updating an agenda item. */
type Props = {
  where: Prisma.AgendaItemWhereUniqueInput;
  data: Prisma.AgendaItemUpdateInput;
};

/** Update an agenda item by ID. */
export async function updateAgendaItem({ where, data }: Props) {
  return await prisma.agendaItem.update({ where, data });
}
