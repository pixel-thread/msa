import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { logger } from "@src/shared/logger";
import { UserRole, AnnouncementStatus } from "@prisma/client";
import {
  createAnnouncement,
  findManyAnnouncements,
} from "@feature/announcement/services";
import {
  CreateAnnouncementSchema,
  AnnouncementQuerySchema,
} from "@feature/announcement/validators";
import { hasHighRoleAccess } from "@src/shared/utils/has-high-role";

export const GET = withAssociation(
  { query: AnnouncementQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info("GET /api/announcements - Request started", { traceId, query });

    const user = await withRole(request, UserRole.MEMBER);
    logger.info("GET /api/announcements - User authorized", { traceId, userId: user.id, roles: user.role });

    if (!query) {
      throw new ForbiddenError("Invalid query parameters");
    }

    const { page, priority, search, status } = query;
    if (hasHighRoleAccess(user.role)) {
      logger.info("GET /api/announcements - High role: fetching all announcements", {
        traceId,
        associationId: association.id,
        page,
        priority,
        search,
        status,
      });

      const result = await findManyAnnouncements({
        associationId: association.id,
        filters: { priority, search, status },
        pagination: { page },
      });

      logger.info("GET /api/announcements - Success", { traceId, count: result.announcements.length });

      return SuccessResponse({
        data: result.announcements,
        meta: result.pagination,
      });
    }

    logger.info("GET /api/announcements - Member: fetching published only", {
      traceId,
      associationId: association.id,
      page,
      priority,
      search,
    });

    const result = await findManyAnnouncements({
      associationId: association.id,
      filters: { status: "PUBLISHED", priority, search },
      pagination: { page },
    });

    logger.info("GET /api/announcements - Success", { traceId, count: result.announcements.length });

    return SuccessResponse({
      data: result.announcements,
      meta: result.pagination,
    });
  },
);

export const POST = withAssociation(
  { body: CreateAnnouncementSchema },
  async (association, { body, traceId }, request) => {
    logger.info("POST /api/announcements - Request started", { traceId });

    const user = await withRole(request, UserRole.SECRETARY);
    logger.info("POST /api/announcements - User authorized", { traceId, userId: user.id, roles: user.role });

    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const userId = request.headers.get("x-user-id")!;
    const isPublishing = body.status === AnnouncementStatus.PUBLISHED;

    logger.info("POST /api/announcements - Creating announcement", {
      traceId,
      associationId: association.id,
      title: body.title,
      status: body.status,
      isPublishing,
    });

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

    logger.info("POST /api/announcements - Success", { traceId, announcementId: announcement.id });

    return SuccessResponse({ data: announcement }, 201);
  },
);
