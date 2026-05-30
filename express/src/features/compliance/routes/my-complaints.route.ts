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
import { buildPagination } from '@src/shared/utils/build-pagination';
import { UnauthorizedError, NotFoundError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
import { findManyComplaints, findUniqueComplaint } from '@src/features/compliance/services';

// ---------------------------------------------------------------------------
// Validators / Types
// ---------------------------------------------------------------------------
import { ComplaintQuerySchema, ComplaintParamsSchema } from '@src/features/compliance/validators';

// ---------------------------------------------------------------------------
// GET /compliance/my  —  List the current user's own complaints
// Security: any authenticated user
// Business intent: allow a member to view only the complaints they have
//   submitted, with optional status / priority / date-range filtering.
// ---------------------------------------------------------------------------
export const listMyComplaints: RequestHandler[] = [
  validate({ query: ComplaintQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
    const userId = req.userId as string;
    if (!userId) {
      logger.error({ traceId }, 'GET /compliance/my - Unauthorized (missing x-user-id)');
      throw new UnauthorizedError('Unauthorized');
    }

    const association = await getAssociation(req);

    // ── Auth log ────────────────────────────────────────────────────────────
    logger.info(
      { traceId, associationId: association.id, userId },
      'GET /compliance/my - Request started',
    );

    // ── Business logic — build filters scoped to current user ───────────────
    const query = req.query as unknown as Record<string, unknown>;
    const where: Record<string, unknown> = { associationId: association.id, userId };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.fromDate) {
      where.createdAt = {
        ...((where.createdAt as object) || {}),
        gte: new Date(query.fromDate as string),
      };
    }
    if (query.toDate) {
      where.createdAt = {
        ...((where.createdAt as object) || {}),
        lte: new Date(query.toDate as string),
      };
    }

    const page = (query.page as number) ?? 1;
    const { complaints, total } = await findManyComplaints({
      where: where as Parameters<typeof findManyComplaints>[0]['where'],
      page,
    });

    // ── Result log & response ───────────────────────────────────────────────
    logger.info({ traceId, count: complaints.length }, 'GET /compliance/my - Success');
    return success(res, { data: complaints, meta: buildPagination(total, page) });
  }),
];

// ---------------------------------------------------------------------------
// GET /compliance/my/:complaintId  —  Fetch a single complaint by the
//   currently-authenticated user
// Security: any authenticated user (scoped to their own complaints)
// Business intent: allow a member to read the full details of a complaint
//   they previously submitted.
// ---------------------------------------------------------------------------
export const getMyComplaint: RequestHandler[] = [
  validate({ params: ComplaintParamsSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
    const userId = req.userId as string;
    if (!userId) {
      logger.error(
        { traceId },
        'GET /compliance/my/:complaintId - Unauthorized (missing x-user-id)',
      );
      throw new UnauthorizedError('Unauthorized');
    }

    // ── Auth log ────────────────────────────────────────────────────────────
    logger.info(
      { traceId, complaintId: req.params.complaintId },
      'GET /compliance/my/:complaintId - Request started',
    );

    const association = await getAssociation(req);

    // ── Business logic — find complaint scoped to user + association ────────
    const complaint = await findUniqueComplaint({
      where: { id: req.params.complaintId as string, associationId: association.id, userId },
    });

    if (!complaint) throw new NotFoundError('Complaint not found');

    // ── Result log & response ───────────────────────────────────────────────
    logger.info(
      { traceId, complaintId: req.params.complaintId },
      'GET /compliance/my/:complaintId - Success',
    );
    return success(res, { data: complaint });
  }),
];
