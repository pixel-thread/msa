import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';
import { buildPagination } from '@src/shared/utils';
import { pageNumberValidation } from '@src/shared/validators';
import { z } from 'zod';
import { getMemberEntries } from '@src/features/ledger/services/ledger.service';
import { logger } from '@src/shared/logger';

/** Schema for paginated member ledger query. */
const QuerySchema = z.object({
  page: pageNumberValidation,
});

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

async function requireRole(req: Request, role: UserRole) {
  const userId = req.userId as string;
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

/** GET /api/ledger/member/:memberId - Retrieve ledger entries for a specific member (FINANCE role required). */
export const getMemberLedger: RequestHandler[] = [
  validate({ query: QuerySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/ledger/member/[memberId] - Request started',
    );

    await requireRole(req, UserRole.FINANCE);

    const { memberId } = req.params;
    const page = (req.query as any).page || 1;

    const { entries, total } = await getMemberEntries(memberId, page);

    logger.info(
      { traceId, memberId, count: entries.length },
      'GET /api/ledger/member/[memberId] - Success',
    );
    return success(res, { data: entries, meta: buildPagination(total, page) });
  },
];
