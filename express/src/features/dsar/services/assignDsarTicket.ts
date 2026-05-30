import { prisma } from '@src/shared/lib/prisma';
import { AuditAction } from '@prisma/client';

/** Parameters for assigning a DSAR ticket. */
type Props = {
  associationId: string;
  ticketId: string;
  actorId: string;
  assignedToId: string;
};

/** Assign a DSAR ticket to an admin and log the change in the audit trail. */
export async function assignDsarTicket({ associationId, ticketId, actorId, assignedToId }: Props) {
  return await prisma.$transaction(async (tx) => {
    const updated = await tx.dsarTicket.update({
      where: { id: ticketId, associationId },
      data: { assignedToId },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.UPDATE,
        resourceType: 'DsarTicket',
        resourceId: ticketId,
        newValues: { assignedToId },
      },
    });

    return updated;
  });
}
