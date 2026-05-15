import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { ValidationError } from "@src/shared/errors";

const UpdateAgendaItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

export const PATCH = withAssociation(
  { body: UpdateAgendaItemSchema },
  async (association, { body }, request, { params }) => {
    await withRole(request, UserRole.SECRETARY);

    if (!body) {
      throw new ValidationError("Invalid body");
    }

    const { itemId } = (await params) as { itemId: string };

    const item = await prisma.agendaItem.update({
      where: {
        id: itemId,
      },
      data: body,
    });

    return SuccessResponse({ data: item });
  }
);

export const DELETE = withAssociation({}, async (association, _, request, { params }) => {
  await withRole(request, UserRole.SECRETARY);

  const { itemId } = (await params) as { itemId: string };

  const item = await prisma.agendaItem.delete({
    where: {
      id: itemId,
    },
  });

  return SuccessResponse({ data: item });
});
