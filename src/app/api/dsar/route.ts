import { withRole, withAssociation } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { findDsarTickets } from "@src/features/dsar/services";
import { DsarQuerySchema } from "@src/features/dsar/validators";

/**
 * @api {get} /api/dsar List All DSAR Tickets
 * @apiName ListDsars
 * @apiGroup DSAR
 * @apiDescription Retrieves a paginated list of all DSAR tickets for the current association.
 * This endpoint is reserved for Data Protection Officers (DPO) and higher roles.
 * 
 * @apiQuery {Number} [page=1] Page number for pagination.
 * @apiQuery {String} [status] Filter by ticket status (e.g., PENDING, COMPLETED).
 * @apiQuery {String} [requestType] Filter by request type (e.g., ACCESS, DELETION).
 * @apiQuery {String} [userId] Filter by a specific member's UUID.
 * 
 * @apiSuccess {Object[]} data List of DsarTicket objects.
 * @apiSuccess {Object} meta Pagination metadata (total, page, limit, totalPages).
 * @apiPermission DPO
 */
export const GET = withAssociation(
  { query: DsarQuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.DPO);

    const result = await findDsarTickets({
      associationId: association.id,
      userId: query?.userId,
      filters: {
        status: query?.status,
        requestType: query?.requestType,
      },
      pagination: {
        page: query?.page ?? 1,
      },
    });

    return SuccessResponse({ data: result.tickets, meta: result.pagination });
  },
);
