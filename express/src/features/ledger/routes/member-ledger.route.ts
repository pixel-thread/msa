// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------

import { UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { buildPagination } from '@src/shared/utils';
import { pageNumberValidation } from '@src/shared/validators';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

import { getMemberEntries } from '@src/features/ledger/services/ledger.service';

// ---------------------------------------------------------------------------
// Local schemas
// ---------------------------------------------------------------------------

/** Schema for paginated member ledger query. */
const QuerySchema = z.object({
  page: pageNumberValidation,
});

// ---------------------------------------------------------------------------
// GET /api/ledger/member/:memberId  –  Retrieve ledger entries for a member
// Security: FINANCE role required
// ---------------------------------------------------------------------------

export const getMemberLedger: RequestHandler[] = [
  validate({ query: QuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ---- Resolve association & log request ---------------------------------

    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/ledger/member/[memberId] - Request started',
    );

    // ---- Authorize (FINANCE role) ------------------------------------------

    await withRole(req, UserRole.FINANCE);

    // ---- Business logic ----------------------------------------------------

    const { memberId } = req.params;
    const page = (req.query as any).page || 1;
    const { entries, total } = await getMemberEntries(memberId as string, page);

    // ---- Result ------------------------------------------------------------

    logger.info(
      { traceId, memberId, count: entries.length },
      'GET /api/ledger/member/[memberId] - Success',
    );
    return success(res, { data: entries, meta: buildPagination(total, page) });
  }),
];
