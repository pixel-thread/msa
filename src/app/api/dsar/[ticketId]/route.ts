import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils";
import { NotFoundError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { findUniqueDsarTicket } from "@src/features/dsar/services";
import { z } from "zod";

const ParamsSchema = z.object({
  ticketId: z.uuid(),
});

/**
 * @api {get} /api/dsar/:ticketId Get DSAR Details
 * @apiName GetDsarDetails
 * @apiGroup DSAR
 * @apiDescription Retrieves full details for a specific DSAR ticket, including responses.
 * 
 * Access Rules:
 * - Members can view their own tickets.
 * - DPOs and higher roles can view any ticket within their association.
 * 
 * @apiParam {String} ticketId Unique UUID of the DSAR ticket.
 * 
 * @apiSuccess {Object} data The DsarTicket object with member, assignedTo, and responses relations.
 * @apiPermission OWNER or DPO
 */
export const GET = withAssociation(
  { params: ParamsSchema },
  async (association, { params }, request) => {
    const userId = request.headers.get("x-user-id")!;
    const ticketId = params!.ticketId;

    const ticket = await findUniqueDsarTicket(ticketId, association.id);

    if (!ticket) {
      throw new NotFoundError("DSAR ticket not found");
    }

    const isOwner = ticket.userId === userId;

    if (!isOwner) {
      // If not owner, check if user has DPO role or higher
      await withRole(request, UserRole.DPO);
    }

    return SuccessResponse({ data: ticket });
  },
);
