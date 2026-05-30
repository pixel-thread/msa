// ---- Routes: Admin consent
// ---- Description: Admin endpoints for viewing all consent records, history, and reports.
// ---- Security: DPO role required (except getConsentHistory which is for the current user)

// External libs
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';

// Shared utilities
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { buildPagination } from '@src/shared/utils';
import { getUniqueUser } from '@src/shared/services/user/get-unique-user';
import { pageNumberValidation } from '@src/shared/validators';
import { logger } from '@src/shared/logger';
import { asyncHandler } from '@src/shared/utils/async-handler';

// Prisma
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';

// Services
import { ConsentService } from '@src/features/consent/services/consent.service';

// Validators
import { AllConsentRecordsQuerySchema } from '@src/features/consent/validators/consent.validators';

// ---- Declarations

/** Schema for paginated history query. */
const HistoryQuerySchema = z.object({
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

// ---- GET /api/consent/all
// ---- Description: Retrieve all consent records for the association.
// ---- Security: DPO role required

export const getAllConsentRecords: RequestHandler[] = [
  validate({ query: AllConsentRecordsQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Extract tracing context

    const traceId = (req.traceId as string) || '';

    // ---- Auth: verify association membership

    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/consent/all - Request started',
    );

    // ---- Auth: verify user has at least DPO role

    await withRole(req, UserRole.DPO);

    // ---- Parse query parameters

    const page = (req.query as any).page ?? 1;

    // ---- Fetch consent records
    // TODO: wire up actual typed service call (currently uses `as any` cast)

    const { records, total } = await ConsentService.getAllConsentRecords(
      association.id,
      req.query as any,
    );

    // ---- Log success and return response

    logger.info({ traceId, count: records.length }, 'GET /api/consent/all - Success');
    return success(res, { data: records, meta: buildPagination(total, page) });
  }),
];

// ---- GET /api/consent/history
// ---- Description: Retrieve the current user's consent history.
// ---- Security: Authenticated user (any role)

export const getConsentHistory: RequestHandler[] = [
  validate({ query: HistoryQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Extract tracing context

    const traceId = (req.traceId as string) || '';

    // ---- Auth: verify association membership

    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/consent/history - Request started',
    );

    // ---- Resolve the requesting user ID

    const userId = req.userId as string;
    if (!userId) throw new UnauthorizedError();

    // ---- Parse query parameters

    const page = (req.query as any).page || 1;

    // ---- Fetch consent history

    const data = await ConsentService.getConsentHistory(userId, association.id, page);

    // ---- Log success and return response

    logger.info({ traceId, userId }, 'GET /api/consent/history - Success');
    return success(res, { data: data.history, meta: data.pagination });
  }),
];

// ---- GET /api/consent/report
// ---- Description: Generate a consent summary report across the association.
// ---- Security: DPO role required

export const getConsentReport = async (req: Request, res: Response, _next: NextFunction) => {
  // ---- Extract tracing context

  const traceId = (req.traceId as string) || '';

  // ---- Auth: verify association membership

  const association = await getAssociation(req);
  logger.info(
    { traceId, associationId: association.id },
    'GET /api/consent/report - Request started',
  );

  // ---- Auth: verify user has at least DPO role

  await withRole(req, UserRole.DPO);

  // ---- Fetch consent report

  const report = await ConsentService.getConsentReport(association.id);

  // ---- Log success and return response

  logger.info({ traceId }, 'GET /api/consent/report - Success');
  return success(res, { data: report });
};
