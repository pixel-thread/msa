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
import { findManyComplaints, createComplaint } from '@src/features/compliance/services';

// ---------------------------------------------------------------------------
// Validators / Types
// ---------------------------------------------------------------------------
import { ComplaintQuerySchema, CreateComplaintSchema } from '@src/features/compliance/validators';

// ---------------------------------------------------------------------------
// GET /compliance  —  List all complaints with optional filters
// Security: requires DPO role
// Business intent: allow data-protection officers to review every complaint
//   filed across the association, with pagination and date/status/priority
//   filtering.
// ---------------------------------------------------------------------------
export const listComplaints: RequestHandler[] = [
  validate({ query: ComplaintQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
    const association = await getAssociation(req);

    // ── Auth log ────────────────────────────────────────────────────────────
    logger.info({ traceId, associationId: association.id }, 'GET /compliance - Request started');

    const user = await withRole(req, UserRole.DPO);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /compliance - User authorized',
    );

    // ── Business logic — build filters & fetch ──────────────────────────────
    const query = req.query as unknown as Record<string, unknown>;
    const where: Record<string, unknown> = { associationId: association.id };

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
    logger.info({ traceId, count: complaints.length }, 'GET /compliance - Success');
    return success(res, { data: complaints, meta: buildPagination(total, page) });
  }),
];

// ---------------------------------------------------------------------------
// POST /compliance  —  Create a new compliance complaint
// Security: requires DPO role
// Business intent: allow DPOs to formally log a compliance concern on
//   behalf of the association (category, subject, description, priority).
// ---------------------------------------------------------------------------
export const createComplaintHandler: RequestHandler[] = [
  validate({ body: CreateComplaintSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
    const association = await getAssociation(req);

    // ── Auth log ────────────────────────────────────────────────────────────
    logger.info({ traceId, associationId: association.id }, 'POST /compliance - Request started');

    const user = await withRole(req, UserRole.DPO);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /compliance - User authorized',
    );

    // ── Business logic ──────────────────────────────────────────────────────
    const userId = req.userId as string;
    const complaint = await createComplaint({
      associationId: association.id,
      userId,
      data: req.body,
    });

    // ── Result log & response ───────────────────────────────────────────────
    logger.info({ traceId, complaintId: complaint.id }, 'POST /compliance - Success');
    return success(res, { data: complaint }, 201);
  }),
];
