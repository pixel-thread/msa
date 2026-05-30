import { Request, NextFunction, Response } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { getSummary } from '@src/features/ledger/services/ledger.service';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** GET /api/ledger/summary - Retrieve ledger summary (FINANCE role required). */
export const getLedgerSummary = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const traceId = (req.traceId as string) || '';
  const association = await getAssociation(req);
  logger.info(
    { traceId, associationId: association.id },
    'GET /api/ledger/summary - Request started',
  );

  await withRole(req, UserRole.FINANCE);

  const data = await getSummary(association.id);

  logger.info({ traceId, count: data.accounts.length }, 'GET /api/ledger/summary - Success');
  return success(res, { data });
});
