// External libs
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import z from 'zod';

// Shared utilities
import { asyncHandler } from '@src/shared/utils/async-handler';
import { success } from '@src/shared/utils/responses';
import { validate } from '@src/shared/lib/validate';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { withRole } from '@src/shared/utils/with-role';
import { buildPagination } from '@src/shared/utils/build-pagination';

// ---- Prisma

import { UserRole } from '@prisma/client';

// ---- Services

import { getUserInvoices, getUserInvoice } from '@src/features/user/services';

// ---- Validators / Types

import { pageNumberValidation } from '@src/shared/validators';

// ---------------------------------------------------------------------------
// Local validation schemas
// ---------------------------------------------------------------------------

/** Query schema for listing invoices with page-based pagination. */
const InvoiceRouteQuery = z.object({
  page: pageNumberValidation,
});

/** Route params schema for fetching a single invoice by UUID. */
const InvoiceRouteParams = z.object({
  invoiceId: z.uuid(),
});

// ---------------------------------------------------------------------------
// GET /api/user/invoices
// List paginated invoices for the authenticated user's association.
// Security: auth (applied at router level) + MEMBER role.
// ---------------------------------------------------------------------------

export const listInvoices: RequestHandler[] = [
  // ---- Validate input

  validate({ query: InvoiceRouteQuery }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Setup

    const traceId = (req.traceId as string) || '';
    const userId = req.userId as string;

    // ---- Authorize

    if (!userId) throw new UnauthorizedError('Unauthorized');

    // ---- Fetch user association

    // The user's association is needed to scope invoice queries so that a
    // user can only see invoices belonging to their own association.
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

    // ---- Auth log

    logger.info(
      { traceId, associationId: association.id },
      'GET /api/user/invoices - Request started',
    );

    // ---- Authorize — require MEMBER role or higher

    await withRole(req, UserRole.MEMBER);

    // ---- Auth log

    logger.info({ traceId, userId: user.id }, 'GET /api/user/invoices - User authorized');

    // ---- Resolve pagination

    const query = req.query as { page?: number };
    const page = query?.page || 1;

    // Defence-in-depth: re-check userId after async role verification.
    if (!userId) throw new UnauthorizedError('Unauthorized');

    // ---- Fetch invoices

    const [invoices, total] = await getUserInvoices({
      where: {
        associationId: association.id,
        userId: userId,
      },
      page,
    });

    // ---- Log success & respond

    logger.info({ traceId, count: invoices.length }, 'GET /api/user/invoices - Success');
    return success(res, {
      data: invoices,
      message: 'Invoices fetched successfully',
      meta: buildPagination(total, page),
    });
  }),
];

// ---------------------------------------------------------------------------
// GET /api/user/invoices/:invoiceId
// Fetch a single invoice by its ID for the authenticated user.
// Security: auth (applied at router level) + MEMBER role.
// ---------------------------------------------------------------------------

export const getInvoice: RequestHandler[] = [
  // ---- Validate input

  validate({ params: InvoiceRouteParams }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Setup

    const traceId = (req.traceId as string) || '';
    const userId = req.userId as string;

    // ---- Authorize

    if (!userId) throw new UnauthorizedError('Unauthorized');

    // ---- Fetch user association

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

    // ---- Auth log

    logger.info(
      { traceId, associationId: association.id },
      'GET /api/user/invoices/[invoiceId] - Request started',
    );

    // ---- Authorize — require MEMBER role or higher

    await withRole(req, UserRole.MEMBER);

    // ---- Auth log

    logger.info(
      { traceId, userId: user.id },
      'GET /api/user/invoices/[invoiceId] - User authorized',
    );

    // Defence-in-depth: re-check userId after async role verification.
    if (!userId) throw new UnauthorizedError('Unauthorized');

    // ---- Extract params

    const params = req.params as z.infer<typeof InvoiceRouteParams>;

    // ---- Fetch invoice

    const invoices = await getUserInvoice({
      where: {
        associationId: association.id,
        userId: userId,
        id: params?.invoiceId,
      },
    });

    // ---- Log success & respond

    logger.info(
      { traceId, invoiceId: params?.invoiceId },
      'GET /api/user/invoices/[invoiceId] - Success',
    );

    return success(res, { data: invoices, message: 'Invoices fetched successfully' });
  }),
];
