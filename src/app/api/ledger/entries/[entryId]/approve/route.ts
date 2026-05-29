import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { approveEntry } from '@src/features/ledger/services/ledger.service';
import { logger } from '@src/shared/logger/server';

export const POST = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info(
    { traceId, associationId: association.id },
    'POST /api/ledger/entries/[entryId]/approve - Request started',
  );

  await withRole(request, UserRole.PRESIDENT);
  const userId = request.headers.get('x-user-id')!;

  const { entryId } = (await params) as { entryId: string };

  const entry = await approveEntry(entryId, userId);

  logger.info({ traceId, entryId }, 'POST /api/ledger/entries/[entryId]/approve - Success');

  return SuccessResponse({ data: entry });
});
