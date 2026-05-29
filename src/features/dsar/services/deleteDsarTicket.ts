import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { AuditAction } from '@prisma/client';

interface DeleteDsarTicketProps {
  associationId: string;
  ticketId: string;
  actorId: string;
}

export async function deleteDsarTicket({
  associationId,
  ticketId,
  actorId,
}: DeleteDsarTicketProps) {
  return await prisma.$transaction(async (tx) => {
    await tx.dsarResponse.deleteMany({ where: { dsarTicketId: ticketId } });

    await tx.dsarTicket.delete({
      where: { id: ticketId, associationId },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.DELETE,
        resourceType: 'DsarTicket',
        resourceId: ticketId,
      },
    });
  });
}
