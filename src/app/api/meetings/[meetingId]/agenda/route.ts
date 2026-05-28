import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { processAgendaOperations } from "@feature/meetings/services/processAgendaOperations";
import {
  AgendaOperationSchema,
  CreateAgendaItemSchema,
} from "@feature/meetings/validators/agenda-items";
import { z } from "zod";
import { ForbiddenError } from "@src/shared/errors";
import { findUniqueMeeting } from "@src/features/meetings";
import { prisma } from "@src/shared/lib/prisma";
import { logger } from "@src/shared/logger";

const ParamsSchema = z.object({ meetingId: z.string("Invalid meeting ID") });

export const GET = withAssociation(
  { params: ParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info("GET /api/meetings/[meetingId]/agenda - Request started", { traceId, meetingId: params?.meetingId, associationId: association.id });

    if (!params) {
      throw new ForbiddenError("Invalid meeting ID");
    }

    const user = await withRole(request, UserRole.MEMBER);
    logger.info("GET /api/meetings/[meetingId]/agenda - User authorized", { traceId, userId: user.id, role: user.role, meetingId: params.meetingId });

    const meeting = await findUniqueMeeting({
      meetingId: params.meetingId,
      associationId: association.id,
    });

    const agenda = meeting.agendaItems;

    logger.info("GET /api/meetings/[meetingId]/agenda - Success", { traceId, meetingId: meeting.id });

    return SuccessResponse({ data: agenda });
  },
);

export const POST = withAssociation(
  { params: ParamsSchema, body: CreateAgendaItemSchema },
  async (_association, { params, body, traceId }, request) => {
    logger.info("POST /api/meetings/[meetingId]/agenda - Request started", { traceId, meetingId: params?.meetingId });

    const user = await withRole(request, UserRole.SECRETARY);
    logger.info("POST /api/meetings/[meetingId]/agenda - User authorized", { traceId, userId: user.id, role: user.role, meetingId: params?.meetingId });

    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    logger.info("POST /api/meetings/[meetingId]/agenda - Creating agenda item", { traceId, meetingId: params?.meetingId });

    let order = body.order;

    if (order === undefined) {
      const count = await prisma.agendaItem.count({
        where: { meetingId: params!.meetingId },
      });
      order = count + 1;
    }

    const item = await prisma.agendaItem.create({
      data: {
        meetingId: params!.meetingId,
        title: body.title,
        description: body.description,
        order,
      },
    });

    logger.info("POST /api/meetings/[meetingId]/agenda - Success", { traceId, meetingId: params!.meetingId, agendaItemId: item.id });

    return SuccessResponse({
      data: item,
      message: "Agenda item created successfully",
    });
  },
);

export const PATCH = withAssociation(
  { params: ParamsSchema, body: AgendaOperationSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info("PATCH /api/meetings/[meetingId]/agenda - Request started", { traceId, meetingId: params?.meetingId, associationId: association.id });

    // Check for administrative roles (Secretary and above)
    const user = await withRole(request, UserRole.SECRETARY);
    logger.info("PATCH /api/meetings/[meetingId]/agenda - User authorized", { traceId, userId: user.id, role: user.role, meetingId: params?.meetingId });

    // params and body are guaranteed to be defined because of withAssociation/withValidation
    logger.info("PATCH /api/meetings/[meetingId]/agenda - Processing agenda operations", { traceId, meetingId: params?.meetingId });

    const items = await processAgendaOperations({
      meetingId: params!.meetingId,
      associationId: association.id,
      operations: body!.operations,
    });

    logger.info("PATCH /api/meetings/[meetingId]/agenda - Success", { traceId, meetingId: params!.meetingId });

    return SuccessResponse({
      data: items,
      message: "Agenda updated successfully",
    });
  },
);
