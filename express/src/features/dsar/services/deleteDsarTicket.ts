import { prisma } from '@src/shared/lib/prisma';
import { AuditAction } from '@prisma/client';

/** Parameters for deleting a DSAR ticket. */
interface DeleteDsarTicketProps {
  associationId: string;
  ticketId: string;
  actorId: string;
}

/** Delete a DSAR ticket and its associated responses, logging the action in the audit trail. */
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
