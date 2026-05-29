import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { getAccounts, createAccount } from '@src/features/ledger/services/ledger.service';
import { pageNumberValidation } from '@src/shared/validators';
import { buildPagination } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';

const CreateAccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
});

const AccountQuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: AccountQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info({ traceId, associationId: association.id }, 'GET /api/ledger/accounts - Request started');

    await withRole(request, UserRole.FINANCE);

    const page = query?.page || 1;
    const { accounts, total } = await getAccounts(association.id, page);

    logger.info({ traceId, count: accounts.length }, 'GET /api/ledger/accounts - Success');

    return SuccessResponse({
      data: accounts,
      meta: buildPagination(total, page),
    });
  },
);

export const POST = withAssociation(
  { body: CreateAccountSchema },
  async (association, { body, traceId }, request) => {
    logger.info({ traceId, associationId: association.id }, 'POST /api/ledger/accounts - Request started');

    await withRole(request, UserRole.FINANCE);

    const account = await createAccount(association.id, body!);

    logger.info({ traceId, accountId: account.id }, 'POST /api/ledger/accounts - Success');

    return SuccessResponse({ data: account }, 201);
  },
);
