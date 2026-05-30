// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
import { UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
import { generateComplianceEvidence } from '@src/features/compliance/services';

// ---------------------------------------------------------------------------
// GET /compliance/evidence  —  Generate compliance evidence report
// Security: requires DPO role
// Business intent: produce a structured snapshot of consent receipts, DSAR
//   tickets, member data, payment transactions, and audit logs for a given
//   lookback window so the DPO can present evidence to a regulator.
// ---------------------------------------------------------------------------
export const getEvidence: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
    const association = await getAssociation(req);

    // ── Auth log ────────────────────────────────────────────────────────────
    logger.info(
      { traceId, associationId: association.id },
      'GET /compliance/evidence - Request started',
    );

    const user = await withRole(req, UserRole.DPO);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /compliance/evidence - User authorized',
    );

    // ── Business logic — generate evidence report ───────────────────────────
    const days = parseInt(req.query.days as string, 10) || 30;
    const evidence = await generateComplianceEvidence(association.id, days);

    // ── Result log & response ───────────────────────────────────────────────
    logger.info({ traceId, associationId: association.id }, 'GET /compliance/evidence - Success');
    return success(res, { data: evidence });
  }),
];
