import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@lib/prisma';

type Props = {
  where: Prisma.AgendaItemWhereUniqueInput;
  data: Prisma.AgendaItemUpdateInput;
};

export async function updateAgendaItem({ where, data }: Props) {
  return await prisma.agendaItem.update({ where, data });
}
