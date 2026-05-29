import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole, UserStatus } from '@prisma/client';
import { getMembers } from '@src/features/members/services/getMembers';
import z from 'zod';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { pageNumberValidation } from '@src/shared/validators/common';
import { logger } from '@src/shared/logger/server';

const QuerySchema = z.object({
  page: pageNumberValidation,
  status: z.nativeEnum(UserStatus).optional(),
  search: z.string().optional(),
});
export const GET = withAssociation(
  { query: QuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'GET /api/members - Request started',
    );

    const user = await withRole(request, UserRole.SECRETARY);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'GET /api/members - User authorized',
    );

    const page = query?.page;
    const status = query?.status;
    const search = query?.search;

    const baseWhere: Record<string, unknown> = {
      associationId: association.id,
    };
    if (status) baseWhere.status = status;

    let members;
    if (search) {
      members = await getMembers({
        where: baseWhere,
        search,
        page,
      });
    } else if (!hasHighRoleAccess(user.role)) {
      members = await getMembers({
        where: { ...baseWhere, status: 'ACTIVE' },
        page,
      });
    } else {
      members = await getMembers({
        where: baseWhere,
        page,
      });
    }

    logger.info(
      {
        traceId,
        count: members.data.length,
      },
      'GET /api/members - Success',
    );

    return SuccessResponse({
      data: members.data,
      meta: members.pagination,
    });
  },
);
