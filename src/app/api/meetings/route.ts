import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole, MeetingStatus } from "@prisma/client";
import { createMeeting, findManyMeetings } from "@feature/meetings/services";
import {
  CreateMeetingSchema,
  MeetingQuerySchema,
} from "@feature/meetings/validators/meetings";
import { hasHighRoleAccess } from "@src/shared/utils/has-high-role";
import { logger } from "@src/shared/logger";

export const GET = withAssociation(
  { query: MeetingQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info("GET /api/meetings - Request started", { traceId, associationId: association.id });

    const user = await withRole(request, UserRole.MEMBER);

    logger.info("GET /api/meetings - User authorized", { traceId, userId: user.id, role: user.role });

    if (!query) {
      throw new ForbiddenError("Invalid query parameters");
    }

    const userId = request.headers.get("x-user-id")!;

    const { page, type, status } = query;

    if (hasHighRoleAccess(user.role)) {
      const result = await findManyMeetings({
        role: user.role,
        associationId: association.id,
        filters: { type, status },
        pagination: { page: page ?? 1 },
      });

      logger.info("GET /api/meetings - Success", { traceId, count: result.meetings.length });

      return SuccessResponse({
        data: result.meetings,
        meta: result.pagination,
      });
    }

    const result = await findManyMeetings({
      role: user.role,
      userId: userId,
      associationId: association.id,
      filters: { status: MeetingStatus.SCHEDULED },
      pagination: { page: page ?? 1 },
    });

    logger.info("GET /api/meetings - Success", { traceId, count: result.meetings.length });

    return SuccessResponse({
      data: result.meetings,
      meta: result.pagination,
    });
  },
);

export const POST = withAssociation(
  { body: CreateMeetingSchema },
  async (association, { body, traceId }, request) => {
    logger.info("POST /api/meetings - Request started", { traceId, associationId: association.id });

    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const userId = request.headers.get("x-user-id")!;
    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError(
        "Only secretary, president, or super admin can create meetings",
      );
    }

    logger.info("POST /api/meetings - User authorized", { traceId, userId: user.id, role: user.role });

    logger.info("POST /api/meetings - Creating meeting", { traceId });

    const meeting = await createMeeting({
      associationId: association.id,
      createdById: userId,
      data: {
        title: body.title,
        type: body.type,
        scheduledAt: new Date(body.scheduledAt),
        venue: body.venue,
        agendaItems: body.agendaItems?.map((item, idx) => ({
          ...item,
          order: item.order ?? idx + 1,
        })),
      },
    });

    logger.info("POST /api/meetings - Success", { traceId, meetingId: meeting.id });

    return SuccessResponse({ data: meeting }, 201);
  },
);
