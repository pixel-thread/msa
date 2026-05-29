import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole, DsarStatus, AuditAction } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { logger } from "@src/shared/logger/server";

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
  async (association, { params, body, traceId }, request) => {
    logger.info({
      traceId,
      associationId: association.id,
      ticketId: params?.ticketId,
    }, "POST /api/dsar/[ticketId]/reject - Request started");

    const actorId = request.headers.get("x-user-id")!;
    const user = await withRole(request, UserRole.DPO);

    logger.info({
      traceId,
      userId: user.id,
    }, "POST /api/dsar/[ticketId]/reject - User authorized");

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

    logger.info({ traceId }, "POST /api/dsar/[ticketId]/reject - Success");

    return SuccessResponse({ data: ticket });
  },
);
