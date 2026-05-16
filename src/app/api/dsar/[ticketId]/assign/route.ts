import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole, AuditAction } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { withValidation } from "@src/shared/api";

const ParamsSchema = z.object({
  ticketId: z.uuid(),
});

const AssignSchema = z.object({
  assignedToId: z.uuid(),
});

/**
 * @api {patch} /api/dsar/:ticketId/assign Assign DSAR Ticket
 * @apiName AssignDsar
 * @apiGroup DSAR
 * @apiDescription Assigns a DSAR ticket to a specific administrator for processing.
 *
 * @apiParam {String} ticketId Unique UUID of the DSAR ticket.
 * @apiBody {String} assignedToId UUID of the administrator being assigned.
 *
 * @apiSuccess {Object} data The updated DsarTicket object.
 * @apiPermission DPO
 */
export const PATCH = withAssociation(
  { params: ParamsSchema, body: AssignSchema },
  async (association, { params, body }, request) => {
    const actorId = request.headers.get("x-user-id")!;
    await withRole(request, UserRole.DPO);

    const ticket = await prisma.$transaction(async (tx) => {
      const updated = await tx.dsarTicket.update({
        where: { id: params!.ticketId, associationId: association.id },
        data: {
          assignedToId: body!.assignedToId,
        },
      });

      await tx.auditLog.create({
        data: {
          associationId: association.id,
          actorId,
          action: AuditAction.UPDATE,
          resourceType: "DsarTicket",
          resourceId: params!.ticketId,
          newValues: { assignedToId: body!.assignedToId },
        },
      });

      return updated;
    });

    return SuccessResponse({ data: ticket });
  },
);
