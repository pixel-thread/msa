import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { DsarStatus } from '@prisma/client';

export async function getDsarSlaStatus(associationId: string) {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const [breached, atRisk, onTrack] = await Promise.all([
    prisma.dsarTicket.count({
      where: {
        associationId,
        status: { notIn: [DsarStatus.COMPLETED, DsarStatus.REJECTED] },
        responseDeadline: { lt: now },
      },
    }),
    prisma.dsarTicket.count({
      where: {
        associationId,
        status: { notIn: [DsarStatus.COMPLETED, DsarStatus.REJECTED] },
        responseDeadline: { gte: now, lte: threeDaysFromNow },
      },
    }),
    prisma.dsarTicket.count({
      where: {
        associationId,
        status: { notIn: [DsarStatus.COMPLETED, DsarStatus.REJECTED] },
        responseDeadline: { gt: threeDaysFromNow },
      },
    }),
  ]);

  return {
    breached,
    atRisk,
    onTrack,
  };
}
