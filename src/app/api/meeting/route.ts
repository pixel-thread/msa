import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole, MeetingStatus } from "@prisma/client";
import {
  createMeeting,
  findManyMeetings,
} from "@feature/meetings/services";
import {
  CreateMeetingSchema,
  MeetingQuerySchema,
} from "@feature/meetings/validators/meetings";
import { NextRequest } from "next/server";

const HIGH_ROLE_USERS: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.PRESIDENT, UserRole.SECRETARY];

export const GET = withAssociation(
  { query: MeetingQuerySchema },
  async (association, { query }, request) => {
    const user = await withRole(request as unknown as NextRequest, UserRole.MEMBER);

    if (!query) {
      throw new ForbiddenError("Invalid query parameters");
    }

    const { page, limit, type, status } = query;

    if (HIGH_ROLE_USERS.includes(user.role)) {
      const result = await findManyMeetings({
        associationId: association.id,
        filters: { type, status },
        pagination: { page, limit },
      });
      return SuccessResponse({ data: result.meetings, meta: result.pagination });
    }

    const result = await findManyMeetings({
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
    const user = await withRole(request as unknown as NextRequest, UserRole.SECRETARY);

    if (!HIGH_ROLE_USERS.includes(user.role)) {
      throw new ForbiddenError("Only secretary, president, or super admin can create meetings");
    }

    const meeting = await createMeeting({
      associationId: association.id,
      createdById: userId,
      data: {
        title: body.title,
        type: body.type,
        scheduledAt: new Date(body.scheduledAt),
        venue: body.venue,
        agendaItems: body.agendaItems,
      },
    });

    return SuccessResponse({ data: meeting }, 201);
  },
);