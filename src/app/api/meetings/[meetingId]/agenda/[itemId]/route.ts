import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { ValidationError } from "@src/shared/errors";
import { logger } from "@src/shared/logger";

const UpdateAgendaItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

export const PATCH = withAssociation(
  { body: UpdateAgendaItemSchema },
  async (association, { body, traceId }, request, { params }) => {
    logger.info("PATCH /api/meetings/[meetingId]/agenda/[itemId] - Request started", { traceId, associationId: association.id });

    const user = await withRole(request, UserRole.SECRETARY);
    logger.info("PATCH /api/meetings/[meetingId]/agenda/[itemId] - User authorized", { traceId, userId: user.id, role: user.role });

    if (!body) {
      throw new ValidationError("Invalid body");
    }

    const { itemId } = (await params) as { itemId: string };

    logger.info("PATCH /api/meetings/[meetingId]/agenda/[itemId] - Updating agenda item", { traceId, itemId });

    const item = await prisma.agendaItem.update({
      where: {
        id: itemId,
      },
      data: body,
    });

    logger.info("PATCH /api/meetings/[meetingId]/agenda/[itemId] - Success", { traceId, itemId });

    return SuccessResponse({ data: item });
  }
);

export const DELETE = withAssociation({}, async (association, { traceId }, request, { params }) => {
  logger.info("DELETE /api/meetings/[meetingId]/agenda/[itemId] - Request started", { traceId, associationId: association.id });

  const user = await withRole(request, UserRole.SECRETARY);
  logger.info("DELETE /api/meetings/[meetingId]/agenda/[itemId] - User authorized", { traceId, userId: user.id, role: user.role });

  const { itemId } = (await params) as { itemId: string };

  logger.info("DELETE /api/meetings/[meetingId]/agenda/[itemId] - Deleting agenda item", { traceId, itemId });

  const item = await prisma.agendaItem.delete({
    where: {
      id: itemId,
    },
  });

  logger.info("DELETE /api/meetings/[meetingId]/agenda/[itemId] - Success", { traceId, itemId });

  return SuccessResponse({ data: item });
});
