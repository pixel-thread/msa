// ---------------------------------------------------------------------------
// ENDPOINT:  GET /api/payments/stats
// SECURITY:  Requires FINANCE role
// PURPOSE:   Return top-level financial statistics for the association
//            dashboard: total collected this month, pending dues amount,
//            and the count of members with outstanding dues.
// ---------------------------------------------------------------------------

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { prisma } from '@src/shared/lib/prisma';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UserRole } from '@prisma/client';
import { withRole } from '@src/shared/utils/with-role';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { getFinancialStats } from '@src/features/payments/services/payment.service';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- Helpers ----

/**
 * Resolve the authenticated user's association for multi-tenant scoping.
 */
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

// ---- Handler ----

export const paymentStats: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info({ traceId }, 'GET /api/payments/stats - Request started');

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce FINANCE role ---
    await withRole(req, UserRole.FINANCE);
    logger.info({ traceId }, 'GET /api/payments/stats - User authorized');

    // --- Business logic: compute financial stats ---
    const data = await getFinancialStats(association.id);

    // --- Log: success ---
    logger.info({ traceId }, 'GET /api/payments/stats - Success');

    // --- Response ---
    return success(res, { data: data.stats, meta: data.pagination });
  }),
];
