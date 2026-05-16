import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole, AnnouncementStatus } from "@prisma/client";
import {
  createAnnouncement,
  findManyAnnouncements,
} from "@feature/announcement/services";
import {
  CreateAnnouncementSchema,
  AnnouncementQuerySchema,
} from "@feature/announcement/validators";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";

export const GET = withAssociation(
  { query: AnnouncementQuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.MEMBER);
    if (!query) {
      throw new ForbiddenError("Invalid query parameters");
    }

    const { page, limit, status, priority, search } = query;

    const result = await findManyAnnouncements({
      associationId: association.id,
      filters: { status, priority, search },
      pagination: { page, limit },
    });

    return SuccessResponse({
      data: result.announcements,
      meta: result.pagination,
    });
  },
);

export const POST = withAssociation(
  { body: CreateAnnouncementSchema },
  async (association, { body }, request) => {
    await withRole(request, UserRole.SECRETARY);
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const userId = request.headers.get("x-user-id")!;

    const isPublishing = body.status === AnnouncementStatus.PUBLISHED;

    const announcement = await createAnnouncement({
      associationId: association.id,
      authorId: userId,
      data: {
        ...body,
        publishedAt: body.publishedAt
          ? new Date(body.publishedAt)
          : isPublishing
            ? new Date()
            : undefined,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      },
      sendNotification: isPublishing,
    });

    return SuccessResponse({ data: announcement }, 201);
  },
);

