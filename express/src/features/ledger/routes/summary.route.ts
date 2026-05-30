// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------

import { Request, NextFunction, Response, RequestHandler } from 'express';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------

import { UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

import { getSummary } from '@src/features/ledger/services/ledger.service';

// ---------------------------------------------------------------------------
// GET /api/ledger/summary  –  Retrieve ledger summary
// Security: FINANCE role required
// ---------------------------------------------------------------------------

export const getLedgerSummary: RequestHandler = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ---- Resolve association -------------------------------------------------

    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/ledger/summary - Request started',
    );

    // ---- Authorize (FINANCE role) --------------------------------------------

    await withRole(req, UserRole.FINANCE);

    // ---- Business logic ------------------------------------------------------

    const data = await getSummary(association.id);

    // ---- Result --------------------------------------------------------------

    logger.info({ traceId, count: data.accounts.length }, 'GET /api/ledger/summary - Success');
    return success(res, { data });
  },
);
