import { withAssociation, withRole } from "@src/shared/api";
import { hasHighRoleAccess, SuccessResponse } from "@src/shared/utils";
import { UserRole, AuditAction } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { getUniqueUser, logAction } from "@src/shared/services";
import { BadRequestError, NotFoundError } from "@src/shared/errors";
import { logger } from "@src/shared/logger/server";

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
  async (association, { params, body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
        ticketId: params?.ticketId,
      },
      "PATCH /api/dsar/[ticketId]/assign - Request started",
    );

    const actorId = request.headers.get("x-user-id")!;

    const actor = await withRole(request, UserRole.DPO);

    logger.info(
      {
        traceId,
        userId: actor.id,
      },
      "PATCH /api/dsar/[ticketId]/assign - User authorized",
    );

    const user = await getUniqueUser({ where: { id: body?.assignedToId } });

    if (!user) throw new NotFoundError("User not found");

    if (!hasHighRoleAccess(user?.role)) {
      throw new BadRequestError("User does have the required role");
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const updated = await tx.dsarTicket.update({
        where: { id: params!.ticketId, associationId: association.id },
        data: {
          assignedToId: body!.assignedToId,
        },
      });

      await logAction({
        associationId: association.id,
        actorId,
        action: AuditAction.UPDATE,
        resourceType: "DsarTicket",
        resourceId: params!.ticketId,
        newValues: { assignedToId: body!.assignedToId },
      });

      return updated;
    });

    logger.info({ traceId }, "PATCH /api/dsar/[ticketId]/assign - Success");

    return SuccessResponse({ data: ticket });
  },
);
