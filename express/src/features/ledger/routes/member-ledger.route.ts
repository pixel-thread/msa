import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { buildPagination } from '@src/shared/utils';
import { pageNumberValidation } from '@src/shared/validators';
import { z } from 'zod';
import { getMemberEntries } from '@src/features/ledger/services/ledger.service';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** Schema for paginated member ledger query. */
const QuerySchema = z.object({
  page: pageNumberValidation,
});

/** GET /api/ledger/member/:memberId - Retrieve ledger entries for a specific member (FINANCE role required). */
export const getMemberLedger: RequestHandler[] = [
  validate({ query: QuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/ledger/member/[memberId] - Request started',
    );

    await withRole(req, UserRole.FINANCE);

    const { memberId } = req.params;
    const page = (req.query as any).page || 1;

    const { entries, total } = await getMemberEntries(memberId as string, page);

    logger.info(
      { traceId, memberId, count: entries.length },
      'GET /api/ledger/member/[memberId] - Success',
    );
    return success(res, { data: entries, meta: buildPagination(total, page) });
  }),
];
