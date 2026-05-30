// ---- Routes: User consent management
// ---- Description: CRUD operations on consent receipts and user-specific consent views.
// ---- Security: DPO role required (except no role requirement for viewing own data)

// External libs
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';

// Shared utilities
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
} from '@src/shared/errors';
import { pageNumberValidation } from '@src/shared/validators';
import { getUniqueUser } from '@src/shared/services/user/get-unique-user';
import { logger } from '@src/shared/logger';
import { asyncHandler } from '@src/shared/utils/async-handler';

// Prisma
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';

// Services
import { ConsentService } from '@src/features/consent/services/consent.service';

// Validators
import {
  ConsentReceiptParamsSchema,
  UpdateConsentReceiptSchema,
} from '@src/features/consent/validators/consent.validators';

// ---- Declarations

/** Schema for user ID path parameter. */
const UserParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

/** Schema for paginated user consent query. */
const UserQuerySchema = z.object({
  page: pageNumberValidation,
});

// ---- Helper: Role hierarchy for permission checks
// Lower number = higher privilege. SUPER_ADMIN (0) is the highest.

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 0,
  PRESIDENT: 1,
  SECRETARY: 2,
  FINANCE: 3,
  DPO: 4,
  MEMBER: 5,
};

// ---- Helper: getAssociation
// Resolves the user's association from the request context.

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

// ---- Helper: withRole
// Ensures the authenticated user meets the minimum role requirement.

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

// ---- GET /api/consent/:receiptId
// ---- Description: Retrieve a single consent receipt by ID.
// ---- Security: DPO role required

export const getReceipt: RequestHandler[] = [
  validate({ params: ConsentReceiptParamsSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Extract tracing context

    const traceId = (req.traceId as string) || '';

    // ---- Auth: verify association membership

    const association = await getAssociation(req);
    const receiptId = req.params.receiptId as string;

    logger.info(
      { traceId, associationId: association.id, receiptId },
      'GET /api/consent/[receiptId] - Request started',
    );

    // ---- Auth: verify user has at least DPO role

    await withRole(req, UserRole.DPO);

    // ---- Fetch the consent receipt

    const receipt = await ConsentService.findUniqueConsentReceipt(association.id, receiptId);
    if (!receipt) throw new NotFoundError('Consent receipt not found');

    // ---- Log success and return response

    logger.info({ traceId }, 'GET /api/consent/[receiptId] - Success');
    return success(res, { data: receipt });
  }),
];

// ---- PATCH /api/consent/:receiptId
// ---- Description: Update a consent receipt.
// ---- Security: DPO role required

export const updateReceipt: RequestHandler[] = [
  validate({ params: ConsentReceiptParamsSchema, body: UpdateConsentReceiptSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Extract tracing context

    const traceId = (req.traceId as string) || '';

    // ---- Auth: verify association membership

    const association = await getAssociation(req);
    const receiptId = req.params.receiptId as string;

    logger.info(
      { traceId, associationId: association.id, receiptId },
      'PATCH /api/consent/[receiptId] - Request started',
    );

    // ---- Validate request body

    if (!req.body) throw new BadRequestError('Request body is required');

    // ---- Auth: verify user has at least DPO role

    await withRole(req, UserRole.DPO);

    // ---- Update the consent receipt

    const receipt = await ConsentService.updateConsentReceipt(
      association.id,
      receiptId,
      req.userId as string,
      req.body,
    );

    // ---- Log success and return response

    logger.info({ traceId }, 'PATCH /api/consent/[receiptId] - Success');
    return success(res, { data: receipt, message: 'Consent receipt updated successfully' });
  }),
];

// ---- DELETE /api/consent/:receiptId
// ---- Description: Delete a consent receipt.
// ---- Security: DPO role required

export const deleteReceipt: RequestHandler[] = [
  validate({ params: ConsentReceiptParamsSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Extract tracing context

    const traceId = (req.traceId as string) || '';

    // ---- Auth: verify association membership

    const association = await getAssociation(req);
    const receiptId = req.params.receiptId as string;

    logger.info(
      { traceId, associationId: association.id, receiptId },
      'DELETE /api/consent/[receiptId] - Request started',
    );

    // ---- Auth: verify user has at least DPO role

    await withRole(req, UserRole.DPO);

    // ---- Delete the consent receipt

    await ConsentService.deleteConsentReceipt(association.id, receiptId, req.userId as string);

    // ---- Log success and return response

    logger.info({ traceId }, 'DELETE /api/consent/[receiptId] - Success');
    return success(res, { data: null, message: 'Consent receipt deleted successfully' });
  }),
];

// ---- GET /api/consent/users/:userId
// ---- Description: Retrieve consent history for a specific user.
// ---- Security: DPO role required

export const getUserConsents: RequestHandler[] = [
  validate({ params: UserParamsSchema, query: UserQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Extract tracing context

    const traceId = (req.traceId as string) || '';

    // ---- Auth: verify association membership

    const association = await getAssociation(req);
    const targetUserId = req.params.userId as string;

    logger.info(
      { traceId, associationId: association.id, targetUserId },
      'GET /api/consent/users/[userId] - Request started',
    );

    // ---- Auth: verify user has at least DPO role

    await withRole(req, UserRole.DPO);

    // ---- Parse query parameters

    const page = (req.query as any).page || 1;

    // ---- Fetch consent history for the target user

    const data = await ConsentService.getUserConsentHistoryById(targetUserId, association.id, page);

    // Return 404 if no records found, so the caller knows the user has no consent history

    if (data.records.length === 0) {
      throw new NotFoundError('No consent records found for this user');
    }

    // ---- Log success and return response

    logger.info(
      { traceId, count: data.records.length },
      'GET /api/consent/users/[userId] - Success',
    );
    return success(res, { data: data.records, meta: data.pagination });
  }),
];
