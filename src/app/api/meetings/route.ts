import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole, MeetingStatus } from "@prisma/client";
import { createMeeting, findManyMeetings } from "@feature/meetings/services";
import {
  CreateMeetingSchema,
  MeetingQuerySchema,
} from "@feature/meetings/validators/meetings";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";

export const GET = withAssociation(
  { query: MeetingQuerySchema },
  async (association, { query }, request) => {
    const user = await withRole(request, UserRole.MEMBER);
    if (!query) {
      throw new ForbiddenError("Invalid query parameters");
    }

    const userId = request.headers.get("x-user-id")!;

    const { page, limit, type, status } = query;

    if (hasHighRoleAccess(user.role)) {
      const result = await findManyMeetings({
        role: user.role,
        associationId: association.id,
        filters: { type, status },
        pagination: { page, limit },
      });

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
      pagination: { page, limit },
    });

    return SuccessResponse({ data: result.meetings, meta: result.pagination });
  },
);

export const POST = withAssociation(
  { body: CreateMeetingSchema },
  async (association, { body }, request) => {
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

    return SuccessResponse({ data: meeting }, 201);
  },
);
