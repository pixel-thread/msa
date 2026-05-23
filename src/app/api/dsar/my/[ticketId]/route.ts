import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { ForbiddenError, NotFoundError } from "@src/shared/errors";

export const GET = withAssociation(
  {},
  async (association, _, request, { params }) => {
    await withRole(request, UserRole.MEMBER);
    const userId = request.headers.get("x-user-id")!;

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

    return SuccessResponse({ data: ticket });
  },
);
