import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { getUserInvoices, getUserInvoice } from '@src/features/user/services';
import { withRole } from '@src/shared/utils/with-role';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { pageNumberValidation } from '@src/shared/validators';
import { logger } from '@src/shared/logger';
import z from 'zod';

/** Query schema for listing invoices with pagination. */
const InvoiceRouteQuery = z.object({
  page: pageNumberValidation,
});

/** Params schema for fetching a single invoice by ID. */
const InvoiceRouteParams = z.object({
  invoiceId: z.uuid(),
});

/** GET handler to list invoices for the authenticated user. */
export const listInvoices: RequestHandler[] = [
  validate({ query: InvoiceRouteQuery }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
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

    logger.info(
      { traceId, associationId: association.id },
      'GET /api/user/invoices - Request started',
    );

    await withRole(req, UserRole.MEMBER);

    logger.info({ traceId, userId: user.id }, 'GET /api/user/invoices - User authorized');

    const query = req.query as { page?: number };
    const page = query?.page || 1;

    if (!userId) throw new UnauthorizedError('Unauthorized');

    const [invoices, total] = await getUserInvoices({
      where: {
        associationId: association.id,
        userId: userId,
      },
      page,
    });

    logger.info({ traceId, count: invoices.length }, 'GET /api/user/invoices - Success');

    return success(res, {
      data: invoices,
      message: 'Invoices fetched successfully',
      meta: buildPagination(total, page),
    });
  },
];

/** GET handler to fetch a single invoice by ID for the authenticated user. */
export const getInvoice: RequestHandler[] = [
  validate({ params: InvoiceRouteParams }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
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

    logger.info(
      { traceId, associationId: association.id },
      'GET /api/user/invoices/[invoiceId] - Request started',
    );

    await withRole(req, UserRole.MEMBER);

    logger.info(
      { traceId, userId: user.id },
      'GET /api/user/invoices/[invoiceId] - User authorized',
    );

    if (!userId) throw new UnauthorizedError('Unauthorized');

    const params = req.params as z.infer<typeof InvoiceRouteParams>;

    const invoices = await getUserInvoice({
      where: {
        associationId: association.id,
        userId: userId,
        id: params?.invoiceId,
      },
    });

    logger.info(
      { traceId, invoiceId: params?.invoiceId },
      'GET /api/user/invoices/[invoiceId] - Success',
    );

    return success(res, { data: invoices, message: 'Invoices fetched successfully' });
  },
];
