import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { CreateLedgerEntrySchema, LedgerQueryParams } from '@src/features/ledger/validators';
import {
  getEntries,
  createManualEntry,
  approveEntry,
} from '@src/features/ledger/services/ledger.service';
import { buildPagination } from '@src/shared/utils';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';

/** GET /api/ledger/entries - List ledger entries (FINANCE role required). */
export const listEntries: RequestHandler[] = [
  validate({ query: LedgerQueryParams }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/ledger/entries - Request started',
    );

    await withRole(req, UserRole.FINANCE);

    const page = (req.query as any).page || 1;
    const { entries, total } = await getEntries(association.id, page);

    logger.info({ traceId, count: entries.length }, 'GET /api/ledger/entries - Success');
    return success(res, { data: entries, meta: buildPagination(total, page) });
  },
];

/** POST /api/ledger/entries - Create a manual ledger entry (FINANCE role required). */
export const createEntry: RequestHandler[] = [
  validate({ body: CreateLedgerEntrySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/ledger/entries - Request started',
    );

    const userId = req.userId as string;
    await withRole(req, UserRole.FINANCE);

    logger.info({ traceId, userId }, 'POST /api/ledger/entries - User authorized');

    const entry = await createManualEntry(association.id, userId, {
      description: req.body.description,
      paymentId: req.body.paymentId,
      lines: req.body.lines,
    });

    logger.info({ traceId, entryId: entry.id }, 'POST /api/ledger/entries - Success');
    return success(res, { data: entry }, 201);
  },
];

/** POST /api/ledger/entries/:entryId/approve - Approve a ledger entry (PRESIDENT role required). */
export const approveEntryHandler = async (req: Request, res: Response, _next: NextFunction) => {
  const traceId = (req.traceId as string) || '';
  const association = await getAssociation(req);
  logger.info(
    { traceId, associationId: association.id },
    'POST /api/ledger/entries/[entryId]/approve - Request started',
  );

  await withRole(req, UserRole.PRESIDENT);
  const userId = req.userId as string;

  const { entryId } = req.params;

  const entry = await approveEntry(entryId as string, userId);

  logger.info({ traceId, entryId }, 'POST /api/ledger/entries/[entryId]/approve - Success');
  return success(res, { data: entry });
};
