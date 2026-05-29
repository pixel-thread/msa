import { UserRole } from '@prisma/client';
import { getMembershipApplications } from '@src/features/membership-applications/services';
import { GetMembershipApplicationsQuerySchema } from '@src/features/membership-applications/validators';
import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation(
  { query: GetMembershipApplicationsQuerySchema },
  async (_association, { query, traceId }, req) => {
    logger.info(
      { traceId, status: query?.status },
      'GET /api/admin/membership-applications - Request started',
    );

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/admin/membership-applications - User authorized',
    );

    const status = query?.status;
    const page = query?.page || 1;

    const where = status ? { status } : {};

    const result = await getMembershipApplications({
      where,
      page,
    });

    logger.info(
      { traceId, count: result.data.length },
      'GET /api/admin/membership-applications - Success',
    );

    return SuccessResponse({ data: result.data, meta: result.pagination });
  },
);
