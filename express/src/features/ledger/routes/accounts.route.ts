import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { getAccounts, createAccount } from '@src/features/ledger/services/ledger.service';
import { pageNumberValidation } from '@src/shared/validators';
import { buildPagination } from '@src/shared/utils';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** Schema for creating a new account. */
const CreateAccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
});

/** Schema for paginated account query. */
const AccountQuerySchema = z.object({
  page: pageNumberValidation,
});

/** GET /api/ledger/accounts - List ledger accounts (FINANCE role required). */
export const listAccounts: RequestHandler[] = [
  validate({ query: AccountQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/ledger/accounts - Request started',
    );

    await withRole(req, UserRole.FINANCE);

    const page = (req.query as any).page || 1;
    const { accounts, total } = await getAccounts(association.id, page);

    logger.info({ traceId, count: accounts.length }, 'GET /api/ledger/accounts - Success');
    return success(res, { data: accounts, meta: buildPagination(total, page) });
  }),
];

/** POST /api/ledger/accounts - Create a new ledger account (FINANCE role required). */
export const createAccountHandler: RequestHandler[] = [
  validate({ body: CreateAccountSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/ledger/accounts - Request started',
    );

    await withRole(req, UserRole.FINANCE);

    const account = await createAccount(association.id, req.body);

    logger.info({ traceId, accountId: account.id }, 'POST /api/ledger/accounts - Success');
    return success(res, { data: account }, 201);
  }),
];
