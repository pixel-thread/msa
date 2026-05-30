// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

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
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

import {
  getEntries,
  createManualEntry,
  approveEntry,
} from '@src/features/ledger/services/ledger.service';

// ---------------------------------------------------------------------------
// Validators / Types
// ---------------------------------------------------------------------------

import { CreateLedgerEntrySchema, LedgerQueryParams } from '@src/features/ledger/validators';

// ---------------------------------------------------------------------------
// GET /api/ledger/entries  –  List ledger entries
// Security: FINANCE role required
// ---------------------------------------------------------------------------

export const listEntries: RequestHandler[] = [
  validate({ query: LedgerQueryParams }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ---- Resolve association & log request ---------------------------------

    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/ledger/entries - Request started',
    );

    // ---- Authorize (FINANCE role) ------------------------------------------

    await withRole(req, UserRole.FINANCE);

    // ---- Business logic ----------------------------------------------------

    const page = (req.query as any).page || 1;
    const { entries, total } = await getEntries(association.id, page);

    // ---- Result ------------------------------------------------------------

    logger.info({ traceId, count: entries.length }, 'GET /api/ledger/entries - Success');
    return success(res, { data: entries, meta: buildPagination(total, page) });
  }),
];

// ---------------------------------------------------------------------------
// POST /api/ledger/entries  –  Create a manual ledger entry
// Security: FINANCE role required
// ---------------------------------------------------------------------------

export const createEntry: RequestHandler[] = [
  validate({ body: CreateLedgerEntrySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ---- Resolve association & log request ---------------------------------

    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/ledger/entries - Request started',
    );

    // ---- Authorize (FINANCE role) ------------------------------------------

    const userId = req.userId as string;
    await withRole(req, UserRole.FINANCE);
    logger.info({ traceId, userId }, 'POST /api/ledger/entries - User authorized');

    // ---- Business logic ----------------------------------------------------

    const entry = await createManualEntry(association.id, userId, {
      description: req.body.description,
      paymentId: req.body.paymentId,
      lines: req.body.lines,
    });

    // ---- Result ------------------------------------------------------------

    logger.info({ traceId, entryId: entry.id }, 'POST /api/ledger/entries - Success');
    return success(res, { data: entry }, 201);
  }),
];

// ---------------------------------------------------------------------------
// POST /api/ledger/entries/:entryId/approve  –  Approve a ledger entry
// Security: PRESIDENT role required (higher authority than FINANCE)
// ---------------------------------------------------------------------------

export const approveEntryHandler = async (req: Request, res: Response, _next: NextFunction) => {
  const traceId = (req.traceId as string) || '';

  // ---- Resolve association & log request ---------------------------------

  const association = await getAssociation(req);
  logger.info(
    { traceId, associationId: association.id },
    'POST /api/ledger/entries/[entryId]/approve - Request started',
  );

  // ---- Authorize (PRESIDENT role) ----------------------------------------

  await withRole(req, UserRole.PRESIDENT);
  const userId = req.userId as string;

  // ---- Business logic ----------------------------------------------------

  const { entryId } = req.params;
  const entry = await approveEntry(entryId as string, userId);

  // ---- Result ------------------------------------------------------------

  logger.info({ traceId, entryId }, 'POST /api/ledger/entries/[entryId]/approve - Success');
  return success(res, { data: entry });
};
