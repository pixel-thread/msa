import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';
import { AgendaOperationInput } from '../validators/agenda-items';

/** Props for processing agenda operations. */
interface ProcessAgendaOperationsProps {
  meetingId: string;
  associationId: string;
  operations: AgendaOperationInput['operations'];
}

/**
 * Process bulk agenda operations (CREATE, UPDATE, DELETE, REORDER) within a transaction.
 */
export async function processAgendaOperations({
  meetingId,
  associationId,
  operations,
}: ProcessAgendaOperationsProps) {
  // Verify meeting exists and belongs to the association
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) throw new NotFoundError('Meeting');

  return await prisma.$transaction(async (tx) => {
    for (const op of operations) {
      switch (op.type) {
        case 'CREATE':
          await tx.agendaItem.create({
            data: {
              ...op.data,
              meetingId,
            },
          });
          break;
        case 'UPDATE':
          await tx.agendaItem.update({
            where: { id: op.id, meetingId },
            data: op.data,
          });
          break;
        case 'DELETE':
          await tx.agendaItem.delete({
            where: { id: op.id, meetingId },
          });
          break;
        case 'REORDER':
          for (const mapping of op.mappings) {
            await tx.agendaItem.update({
              where: { id: mapping.id, meetingId },
              data: { order: mapping.order },
            });
          }
          break;
      }
    }
    // Return the updated agenda items list sorted by order
    return await tx.agendaItem.findMany({
      where: { meetingId },
      orderBy: { order: 'asc' },
    });
  });
}
