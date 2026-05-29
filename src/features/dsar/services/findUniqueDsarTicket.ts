import 'server-only';
import { prisma } from '@src/shared/lib/prisma';

export async function findUniqueDsarTicket(id: string, associationId: string) {
  return await prisma.dsarTicket.findUnique({
    where: { id, associationId },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      responses: true,
    },
  });
}
