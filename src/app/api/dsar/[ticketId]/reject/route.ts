import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole, DsarStatus, AuditAction } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";

const ParamsSchema = z.object({
  ticketId: z.uuid(),
});

const RejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

/**
 * @api {post} /api/dsar/:ticketId/reject Reject DSAR Request
 * @apiName RejectDsar
 * @apiGroup DSAR
 * @apiDescription Officially rejects a DSAR request with a valid reason. 
 * This terminates the ticket lifecycle and sets the terminal REJECTED status.
 * 
 * @apiParam {String} ticketId Unique UUID of the DSAR ticket.
 * @apiBody {String} reason Justification for the rejection (max 500 chars).
 * 
 * @apiSuccess {Object} data The updated DsarTicket object.
 * @apiPermission DPO
 */
export const POST = withAssociation(
  { params: ParamsSchema, body: RejectSchema },
  async (association, { params, body }, request) => {
    const actorId = request.headers.get("x-user-id")!;
    await withRole(request, UserRole.DPO);

    const ticket = await prisma.$transaction(async (tx) => {
      const updated = await tx.dsarTicket.update({
        where: { id: params!.ticketId, associationId: association.id },
        data: {
          status: DsarStatus.REJECTED,
          rejectedReason: body!.reason,
          completedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          associationId: association.id,
          actorId,
          action: AuditAction.DSAR_RESPOND,
          resourceType: "DsarTicket",
          resourceId: params!.ticketId,
          newValues: {
            status: DsarStatus.REJECTED,
            rejectedReason: body!.reason,
          },
        },
      });

      return updated;
    });

    return SuccessResponse({ data: ticket });
  },
);
