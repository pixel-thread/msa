import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { buildPagination } from '@src/shared/utils';
import { UserRole } from '@prisma/client';
import { pageNumberValidation } from '@src/shared/validators';
import { z } from 'zod';
import { getMemberEntries } from '@src/features/ledger/services/ledger.service';
import { logger } from '@src/shared/logger/server';

const QuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: QuerySchema },
  async (association, { query, traceId }, request, { params }) => {
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/ledger/member/[memberId] - Request started',
    );

    await withRole(request, UserRole.FINANCE);

    const { memberId } = (await params) as { memberId: string };
    const page = query?.page || 1;

    const { entries, total } = await getMemberEntries(memberId, page);

    logger.info({ traceId, memberId, count: entries.length }, 'GET /api/ledger/member/[memberId] - Success');

    return SuccessResponse({
      data: entries,
      meta: buildPagination(total, page),
    });
  },
);
