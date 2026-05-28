import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { ForbiddenError, NotFoundError } from "@src/shared/errors";
import { logger } from "@src/shared/logger";

export const GET = withAssociation(
  {},
  async (association, { traceId }, request, { params }) => {
    logger.info("GET /api/dsar/my/[ticketId] - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(request, UserRole.MEMBER);
    const userId = request.headers.get("x-user-id")!;

    logger.info("GET /api/dsar/my/[ticketId] - User authorized", {
      traceId,
      userId: user.id,
    });

    const { ticketId } = (await params) as { ticketId: string };

    const ticket = await prisma.dsarTicket.findUnique({
      where: {
        id: ticketId,
        associationId: association.id,
      },
      include: {
        responses: true,
        assignedTo: true,
      },
    });

    if (!ticket) {
      throw new NotFoundError("Ticket not found");
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenError("Not authorized to view this ticket");
    }

    logger.info("GET /api/dsar/my/[ticketId] - Success", { traceId, ticketId });

    return SuccessResponse({ data: ticket });
  },
);
