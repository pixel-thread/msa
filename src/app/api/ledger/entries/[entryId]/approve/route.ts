import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole, ApprovalStatus } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { logger } from '@src/shared/logger/server';

export const POST = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info(
    {
      traceId,
      associationId: association.id,
    },
    'POST /api/ledger/entries/[entryId]/approve - Request started',
  );

  const user = await withRole(request, UserRole.PRESIDENT);
  const userId = request.headers.get('x-user-id')!;

  logger.info(
    {
      traceId,
      userId: user.id,
    },
    'POST /api/ledger/entries/[entryId]/approve - User authorized',
  );

  const { entryId } = (await params) as { entryId: string };

  const entry = await prisma.ledgerEntry.update({
    where: { id: entryId },
    data: {
      approvalStatus: ApprovalStatus.APPROVED,
      approvedById: userId,
    },
  });

  logger.info(
    {
      traceId,
      entryId,
    },
    'POST /api/ledger/entries/[entryId]/approve - Success',
  );

  return SuccessResponse({ data: entry });
});
