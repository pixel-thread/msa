import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { processAgendaOperations } from "@feature/meetings/services/processAgendaOperations";
import { AgendaOperationSchema } from "@feature/meetings/validators/agenda-items";
import { z } from "zod";
import { ForbiddenError } from "@src/shared/errors";
import { findUniqueMeeting } from "@src/features/meetings";
import { prisma } from "@src/shared/lib/prisma";

const ParamsSchema = z.object({
  meetingId: z.string("Invalid meeting ID"),
});

export const GET = withAssociation(
  { params: ParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }

    await withRole(request, UserRole.MEMBER);

    const meeting = await findUniqueMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    const agenda = meeting.agendaItems;

    return SuccessResponse({
      data: agenda,
      meta: { total: meeting.attendees.length },
    });
  },
);

const CreateAgendaItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

export const POST = withAssociation(
  { params: ParamsSchema, body: CreateAgendaItemSchema },
  async (association, { params, body }, request) => {
    await withRole(request, UserRole.SECRETARY);

    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }
    
    let order = body.order;
    if (order === undefined) {
      const count = await prisma.agendaItem.count({
        where: { meetingId: params!.meetingId }
      });
      order = count + 1;
    }

    const item = await prisma.agendaItem.create({
      data: {
        meetingId: params!.meetingId,
        title: body.title,
        description: body.description,
        order,
      }
    });

    return SuccessResponse({
      data: item,
      message: "Agenda item created successfully",
    });
  },
);

export const PATCH = withAssociation(
  { params: ParamsSchema, body: AgendaOperationSchema },
  async (association, { params, body }, request) => {
    // Check for administrative roles (Secretary and above)
    await withRole(request, UserRole.SECRETARY);

    // params and body are guaranteed to be defined because of withAssociation/withValidation
    const items = await processAgendaOperations({
      meetingId: params!.meetingId,
      associationId: association.id,
      operations: body!.operations,
    });

    return SuccessResponse({
      data: items,
      message: "Agenda updated successfully",
    });
  },
);
