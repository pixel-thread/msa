import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { CreateLedgerEntrySchema, LedgerQueryParams } from '@src/features/ledger/validators';
import { getEntries, createManualEntry } from '@src/features/ledger/services/ledger.service';
import { buildPagination } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation(
  { query: LedgerQueryParams },
  async (association, { query, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/ledger/entries - Request started',
    );

    await withRole(request, UserRole.FINANCE);

    const page = query?.page || 1;
    const { entries, total } = await getEntries(association.id, page);

    logger.info({ traceId, count: entries.length }, 'GET /api/ledger/entries - Success');

    return SuccessResponse({
      data: entries,
      meta: buildPagination(total, page),
    });
  },
);

export const POST = withAssociation(
  { body: CreateLedgerEntrySchema },
  async (association, { body, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/ledger/entries - Request started',
    );

    const userId = request.headers.get('x-user-id')!;

    await withRole(request, UserRole.FINANCE);
    logger.info({ traceId, userId }, 'POST /api/ledger/entries - User authorized');

    logger.info({ traceId, body }, 'POST /api/ledger/entries - Starting entry creation');
    const entry = await createManualEntry(association.id, userId, {
      description: body!.description,
      paymentId: body!.paymentId,
      lines: body!.lines,
    });

    logger.info({ traceId, body }, 'POST /api/ledger/entries - Completed entry creation');

    logger.info({ traceId, entryId: entry.id }, 'POST /api/ledger/entries - Success');
    return SuccessResponse({ data: entry }, 201);
  },
);
