import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { logger } from '@src/shared/logger';
import z from 'zod';
import { withRole } from '@src/shared/utils/with-role';

/** Schema for validating the route parameter containing the member ID. */
const ParamSchema = z.object({ memberId: z.uuid() });

/** Route handler for retrieving a single member by ID. Requires DPO role. */
export const getMember: RequestHandler[] = [
  validate({ params: ParamSchema }),
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
      'GET /api/members/[memberId] - Request started',
    );

    await withRole(req, UserRole.DPO);

    logger.info({ traceId, userId: user.id }, 'GET /api/members/[memberId] - User authorized');

    const params = req.params as z.infer<typeof ParamSchema>;

    const member = await findFirstMember({
      where: { id: params.memberId, associationId: association.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        membershipNumber: true,
        designation: true,
        mobile: true,
        dateOfJoiningGovt: true,
        dateOfJoiningAssociation: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            meetingAttendances: true,
          },
        },
      },
    });

    if (!member || member.id !== params.memberId) {
      throw new NotFoundError('Member not found');
    }

    logger.info({ traceId, memberId: params.memberId }, 'GET /api/members/[memberId] - Success');

    return success(res, { data: member });
  },
];
