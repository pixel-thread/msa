// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';
import { withRole } from '@src/shared/utils/with-role';
import { logger } from '@src/shared/logger';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
import { UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// External feature services
// ---------------------------------------------------------------------------
import { getUserPaymentHistory } from '@feature/payments/services/payment.service';
import { getUserContributionSummary } from '@feature/payments/services/contribution.service';

// ---------------------------------------------------------------------------
// Validators / Types
// ---------------------------------------------------------------------------
import { LedgerQueryParams, LedgerRouteParams } from '@src/features/ledger/validators';

// ---------------------------------------------------------------------------
// GET /api/members/:memberId/ledger  —  Payment ledger + contribution summary
// Security: requires FINANCE role
// Business intent: give finance officers a single view of a member's payment
//   transactions alongside their contribution totals for reconciliation.
// ---------------------------------------------------------------------------
export const getMemberLedger: RequestHandler[] = [
  validate({ params: LedgerRouteParams, query: LedgerQueryParams }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
    const userId = req.userId as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { association: true },
    });
    if (!user || !user.associationId) throw new ForbiddenError('User association not found');

    const association = {
      id: user.association.id,
      slug: user.association.slug,
      name: user.association.name,
    };

    // ── Auth log ────────────────────────────────────────────────────────────
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/members/[memberId]/ledger - Request started',
    );

    await withRole(req, UserRole.FINANCE);

    logger.info(
      { traceId, userId: user.id },
      'GET /api/members/[memberId]/ledger - User authorized',
    );

    // ── Business logic — fetch payments & summary concurrently ──────────────
    const query = req.query as { page?: number };
    const page = query?.page ?? 1;

    const [history, summary] = await Promise.all([
      getUserPaymentHistory(userId, page),
      getUserContributionSummary(userId),
    ]);

    // ── Result log & response ───────────────────────────────────────────────
    logger.info(
      { traceId, count: history.transactions.length },
      'GET /api/members/[memberId]/ledger - Success',
    );

    return success(res, {
      data: { transactions: history.transactions, summary },
      meta: history.pagination,
    });
  }),
];
