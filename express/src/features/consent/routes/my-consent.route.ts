// ---- GET /api/consent/my
// ---- Description: Retrieve the current user's consent state for all purposes.
// ---- Security: MEMBER role or higher

// External libs
import { Request, Response, RequestHandler } from 'express';

// Shared utilities
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getUniqueUser } from '@src/shared/services/user/get-unique-user';
import { asyncHandler } from '@src/shared/utils/async-handler';

// Prisma
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';

// Services
import { ConsentService } from '@src/features/consent/services/consent.service';

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

// ---- Handler

export const getMyConsent: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  // ---- Extract tracing context

  const traceId = (req.traceId as string) || '';

  // ---- Auth: verify association membership

  const association = await getAssociation(req);
  logger.info({ traceId, associationId: association.id }, 'GET /api/consent/my - Request started');

  // ---- Auth: verify user has at least MEMBER role

  await withRole(req, UserRole.MEMBER);

  // ---- Resolve the requesting user ID

  const userId = req.userId as string;
  if (!userId) throw new UnauthorizedError('User ID not found');

  // ---- Fetch the user's current consent state

  const consentState = await ConsentService.getUserConsentState(userId, association.id);

  // ---- Log success and return response

  logger.info({ traceId }, 'GET /api/consent/my - Success');
  return success(res, { data: consentState });
});
