import { prisma } from '@src/shared/lib/prisma';
import { DsarStatus, AuditAction } from '@prisma/client';

/** Parameters for responding to a DSAR ticket. */
interface RespondToDsarTicketProps {
  associationId: string;
  ticketId: string;
  actorId: string;
  data: {
    status: DsarStatus;
    notes?: string;
    rejectedReason?: string;
    responseType?: string;
    storageKey?: string;
    deliveryMethod?: string;
  };
}

/**
 * Processes a response to an existing DSAR ticket.
 *
 * This service is a multi-step transactional operation that:
 * 1. Updates the ticket status (e.g., to COMPLETED or REJECTED).
 * 2. If providing data, creates a DsarResponse record linked to the ticket.
 * 3. Sets the 'completedAt' timestamp if the status is terminal.
 * 4. Logs the DSAR_RESPOND action in the AuditLog with the response payload.
 *
 * @param {RespondToDsarTicketProps} props - Ticket ID, Association context, actor ID, and response data.
 * @returns {Promise<DsarTicket>} The updated DSAR ticket.
 */
export async function respondToDsarTicket({
  associationId,
  ticketId,
  actorId,
  data,
}: RespondToDsarTicketProps) {
  return await prisma.$transaction(async (tx) => {
    const ticket = await tx.dsarTicket.update({
      where: { id: ticketId, associationId },
      data: {
        status: data.status,
        rejectedReason: data.rejectedReason,
        completedAt: data.status === DsarStatus.COMPLETED ? new Date() : undefined,
      },
    });

    if (data.responseType) {
      await tx.dsarResponse.create({
        data: {
          dsarTicketId: ticketId,
          responseType: data.responseType,
          storageKey: data.storageKey,
          deliveryMethod: data.deliveryMethod || 'secure_download',
          notes: data.notes,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.DSAR_RESPOND,
        resourceType: 'DsarTicket',
        resourceId: ticketId,
        newValues: data as any,
      },
    });

    return ticket;
  });
}
