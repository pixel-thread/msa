import { prisma } from '@src/shared/lib/prisma';
import { DsarRequestType, DsarStatus, AuditAction } from '@prisma/client';

/** Parameters for submitting a DSAR ticket. */
interface SubmitDsarTicketProps {
  associationId: string;
  userId: string;
  data: {
    requestType: DsarRequestType;
    requestedData: string[];
    description?: string;
  };
}

/**
 * Submits a new Data Subject Access Request (DSAR) ticket.
 *
 * This service performs the following:
 * 1. Generates a unique, human-readable ticket number (DSAR-YYYY-RANDOM).
 * 2. Creates the DsarTicket record with a default 21-day response deadline (handled by DB).
 * 3. Records a DSAR_SUBMIT action in the immutable AuditLog.
 *
 * @param {SubmitDsarTicketProps} props - The association ID, user ID, and ticket data.
 * @returns {Promise<DsarTicket>} The created DSAR ticket.
 */
export async function submitDsarTicket({ associationId, userId, data }: SubmitDsarTicketProps) {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const ticketNumber = `DSAR-${year}-${random}`;

  return await prisma.$transaction(async (tx) => {
    const ticket = await tx.dsarTicket.create({
      data: {
        associationId,
        userId,
        ticketNumber,
        requestType: data.requestType,
        requestedData: data.requestedData,
        description: data.description,
        status: DsarStatus.PENDING,
      },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId: userId,
        action: AuditAction.DSAR_SUBMIT,
        resourceType: 'DsarTicket',
        resourceId: ticket.id,
        newValues: ticket as any,
      },
    });

    return ticket;
  });
}
