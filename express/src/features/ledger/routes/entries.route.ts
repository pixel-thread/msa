import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';
import { CreateLedgerEntrySchema, LedgerQueryParams } from '@src/features/ledger/validators';
import {
  getEntries,
  createManualEntry,
  approveEntry,
} from '@src/features/ledger/services/ledger.service';
import { buildPagination } from '@src/shared/utils';
import { logger } from '@src/shared/logger';

async function getAssociation(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { association: true },
  });
  if (!user || !user.associationId) throw new ForbiddenError('User association not found');
  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

async function requireRole(req: Request, role: UserRole) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError('User not found');
  const roleHierarchy = [
    UserRole.MEMBER,
    UserRole.FINANCE,
    UserRole.DPO,
    UserRole.PRESIDENT,
    UserRole.SUPER_ADMIN,
  ];
  const userLevel = roleHierarchy.indexOf(user.role);
  const requiredLevel = roleHierarchy.indexOf(role);
  if (userLevel < requiredLevel) throw new ForbiddenError('Insufficient role');
  return user;
}

export const listEntries: RequestHandler[] = [
  validate({ query: LedgerQueryParams }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/ledger/entries - Request started',
    );

    await requireRole(req, UserRole.FINANCE);

    const page = (req.query as any).page || 1;
    const { entries, total } = await getEntries(association.id, page);

    logger.info({ traceId, count: entries.length }, 'GET /api/ledger/entries - Success');
    return success(res, { data: entries, meta: buildPagination(total, page) });
  },
];

export const createEntry: RequestHandler[] = [
  validate({ body: CreateLedgerEntrySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/ledger/entries - Request started',
    );

    const userId = req.headers['x-user-id'] as string;
    await requireRole(req, UserRole.FINANCE);

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

export const approveEntryHandler = async (req: Request, res: Response, _next: NextFunction) => {
  const traceId = (req.headers['x-trace-id'] as string) || '';
  const association = await getAssociation(req);
  logger.info(
    { traceId, associationId: association.id },
    'POST /api/ledger/entries/[entryId]/approve - Request started',
  );

  await requireRole(req, UserRole.PRESIDENT);
  const userId = req.headers['x-user-id'] as string;

  const { entryId } = req.params;

  const entry = await approveEntry(entryId, userId);

  logger.info({ traceId, entryId }, 'POST /api/ledger/entries/[entryId]/approve - Success');
  return success(res, { data: entry });
};
