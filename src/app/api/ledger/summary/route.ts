import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation({}, async (association, { traceId }, request) => {
  logger.info(
    {
      traceId,
      associationId: association.id,
    },
    'GET /api/ledger/summary - Request started',
  );

  const user = await withRole(request, UserRole.FINANCE);

  logger.info(
    {
      traceId,
      userId: user.id,
    },
    'GET /api/ledger/summary - User authorized',
  );

  const accounts = await prisma.account.findMany({
    where: { associationId: association.id },
  });

  logger.info(
    {
      traceId,
      count: accounts.length,
    },
    'GET /api/ledger/summary - Success',
  );

  return SuccessResponse({
    data: { accounts, summary: 'Ledger summary placeholder' },
  });
});
