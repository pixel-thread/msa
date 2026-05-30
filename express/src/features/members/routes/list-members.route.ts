import { Request, NextFunction, Response, type RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';
import { UserRole, UserStatus } from '@prisma/client';
import { getMembers } from '@src/features/members/services/getMembers';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { pageNumberValidation } from '@src/shared/validators/common';
import { logger } from '@src/shared/logger';
import z from 'zod';
import { auth } from '@src/middleware/auth';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** Schema for validating query parameters when listing members. */
const QuerySchema = z.object({
  page: pageNumberValidation,
  status: z.enum(UserStatus).optional(),
  search: z.string().optional(),
});

/** Route handler for listing members with pagination, filtering, and search. Requires SECRETARY role. */
export const listMembers: RequestHandler[] = [
  auth,
  validate({ query: QuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    const userId: string = (req.userId as string) || '';

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

    logger.info({ traceId, associationId: association.id }, 'GET /api/members - Request started');

    await withRole(req, UserRole.SECRETARY);

    logger.info({ traceId, userId: user.id }, 'GET /api/members - User authorized');

    const query = req.query as unknown as z.infer<typeof QuerySchema>;
    const page = query?.page;
    const status = query?.status;
    const search = query?.search;

    const baseWhere: Record<string, unknown> = {
      associationId: association.id,
    };
    if (status) baseWhere.status = status;

    let members;
    if (search) {
      members = await getMembers({ where: baseWhere, search, page });
    } else if (!hasHighRoleAccess(user.role)) {
      members = await getMembers({ where: { ...baseWhere, status: 'ACTIVE' }, page });
    } else {
      members = await getMembers({ where: baseWhere, page });
    }

    logger.info({ traceId, count: members.data.length }, 'GET /api/members - Success');

    return success(res, { data: members.data, meta: members.pagination });
  }),
];
