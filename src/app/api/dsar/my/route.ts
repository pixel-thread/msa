import { withAssociation } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { findDsarTickets } from '@src/features/dsar/services';
import { DsarQuerySchema } from '@src/features/dsar/validators';
import { logger } from '@src/shared/logger/server';

/**
 * @api {get} /api/dsar/my List My DSAR Tickets
 * @apiName ListMyDsars
 * @apiGroup DSAR
 * @apiDescription Retrieves a paginated list of DSAR tickets filed by the authenticated member.
 * Results are strictly scoped to the current user and their association.
 *
 * @apiQuery {Number} [page=1] Page number for pagination.
 * @apiQuery {String} [status] Filter by ticket status.
 * @apiQuery {String} [requestType] Filter by request type.
 *
 * @apiSuccess {Object[]} data List of DsarTicket objects.
 * @apiSuccess {Object} meta Pagination metadata.
 * @apiPermission MEMBER
 */
export const GET = withAssociation(
  { query: DsarQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'GET /api/dsar/my - Request started',
    );

    const userId = request.headers.get('x-user-id')!;

    const result = await findDsarTickets({
      associationId: association.id,
      userId,
      filters: {
        status: query?.status,
        requestType: query?.requestType,
      },
      pagination: {
        page: query?.page ?? 1,
      },
    });

    logger.info(
      {
        traceId,
        userId,
        count: result.tickets.length,
      },
      'GET /api/dsar/my - Success',
    );

    return SuccessResponse({ data: result.tickets, meta: result.pagination });
  },
);
