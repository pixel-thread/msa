import { Request, Response, NextFunction } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { logger } from '@src/shared/logger';
import z from 'zod';

const ParamSchema = z.object({ memberId: z.uuid() });

export const getMember = [
  validate({ params: ParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) throw new UnauthorizedError('Unauthorized');

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { association: true },
      });
      if (!user || !user.associationId) throw new ForbiddenError('User association not found');
      const association = { id: user.association.id, slug: user.association.slug, name: user.association.name };

      logger.info({ traceId, associationId: association.id }, 'GET /api/members/[memberId] - Request started');

      if (!user.role.includes(UserRole.DPO)) throw new ForbiddenError('Insufficient permissions');

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
    } catch (e) { next(e); }
  },
];
