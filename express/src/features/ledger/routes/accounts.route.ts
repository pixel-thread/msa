import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { getAccounts, createAccount } from '@src/features/ledger/services/ledger.service';
import { pageNumberValidation } from '@src/shared/validators';
import { buildPagination } from '@src/shared/utils';
import { getUniqueUser } from '@src/shared/services/user/get-unique-user';
import { logger } from '@src/shared/logger';

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

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 0,
  PRESIDENT: 1,
  SECRETARY: 2,
  FINANCE: 3,
  DPO: 4,
  MEMBER: 5,
};

async function getAssociation(req: Request) {
  const userId = req.userId as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { association: true },
  });
  if (!user || !user.associationId) throw new ForbiddenError('User association not found');
  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

async function withRole(req: Request, role: UserRole) {
  const userId = req.userId as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await getUniqueUser({ where: { id: userId } });
  if (!user) throw new UnauthorizedError('Unauthorized');
  const roles = user.role as UserRole[];
  const highestUserRole = roles.reduce((highest, current) =>
    ROLE_HIERARCHY[current] < ROLE_HIERARCHY[highest] ? current : highest,
  );
  const hasPermission = ROLE_HIERARCHY[highestUserRole] <= ROLE_HIERARCHY[role];
  if (!hasPermission) throw new ForbiddenError('Permission denied');
  return { ...user, role: roles };
}

/** GET /api/ledger/accounts - List ledger accounts (FINANCE role required). */
export const listAccounts: RequestHandler[] = [
  validate({ query: AccountQuerySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
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
  },
];

/** POST /api/ledger/accounts - Create a new ledger account (FINANCE role required). */
export const createAccountHandler: RequestHandler[] = [
  validate({ body: CreateAccountSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
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
  },
];
