import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { logger } from "@src/shared/logger";
import { UserRole, AnnouncementStatus } from "@prisma/client";
import {
  updateAnnouncement,
  deleteAnnouncement,
  findUniqueAnnouncement,
} from "@feature/announcement/services";
import { UpdateAnnouncementSchema } from "@feature/announcement/validators";
import { hasHighRoleAccess } from "@src/shared/utils/has-high-role";
import { NextRequest } from "next/server";
import z from "zod";

const RouteParams = z.object({
  announcementId: z.uuid(),
});

export const GET = withAssociation(
  { params: RouteParams },
  async (association, { params, traceId }, request) => {
    logger.info("GET /api/announcements/[id] - Request started", { traceId, announcementId: params?.announcementId });

    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError("Invalid announcement id");
    }

    await withRole(request, UserRole.MEMBER);
    logger.info("GET /api/announcements/[id] - User authorized", { traceId, announcementId });

    const announcement = await findUniqueAnnouncement({
      announcementId,
      associationId: association.id,
    });

    logger.info("GET /api/announcements/[id] - Success", { traceId, announcementId });

    return SuccessResponse({
      data: announcement,
      message: "Successfully fetch announcement",
    });
  },
);

export const PUT = withAssociation(
  { body: UpdateAnnouncementSchema, params: RouteParams },
  async (association, { body, params, traceId }, request: NextRequest) => {
    logger.info("PUT /api/announcements/[id] - Request started", { traceId });

    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError("Invalid announcement id");
    }

    const userId = request.headers.get("x-user-id")!;
    const user = await withRole(request, UserRole.MEMBER);
    logger.info("PUT /api/announcements/[id] - User authorized", { traceId, userId, announcementId });

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError("Only high role users can update announcements");
    }

    logger.info("PUT /api/announcements/[id] - Updating announcement", { traceId, announcementId });

    const announcement = await updateAnnouncement({
      announcementId,
      associationId: association.id,
      authorId: userId,
      data: {
        ...body,
        publishedAt: body.publishedAt
          ? new Date(body.publishedAt)
          : body.publishedAt === null
            ? null
            : undefined,
        expiresAt: body.expiresAt
          ? new Date(body.expiresAt)
          : body.expiresAt === null
            ? null
            : undefined,
      },
    });

    logger.info("PUT /api/announcements/[id] - Success", { traceId, announcementId });

    return SuccessResponse({ data: announcement });
  },
);

export const DELETE = withAssociation(
  { params: RouteParams },
  async (association, { params, traceId }, request: NextRequest) => {
    logger.info("DELETE /api/announcements/[id] - Request started", { traceId, announcementId: params?.announcementId });

    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError("Invalid announcement id");
    }
    const userId = request.headers.get("x-user-id")!;
    const user = await withRole(request, UserRole.MEMBER);
    logger.info("DELETE /api/announcements/[id] - User authorized", { traceId, userId, announcementId });

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError("Only high role users can delete announcements");
    }

    logger.info("DELETE /api/announcements/[id] - Deleting announcement", { traceId, announcementId });

    await deleteAnnouncement({
      announcementId,
      associationId: association.id,
      authorId: userId,
    });

    logger.info("DELETE /api/announcements/[id] - Success", { traceId, announcementId });

    return SuccessResponse({ data: { success: true } });
  },
);

export const PATCH = withAssociation(
  { params: RouteParams },
  async (association, { params, traceId }, request) => {
    logger.info("PATCH /api/announcements/[id] - Request started", { traceId, announcementId: params?.announcementId });

    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError("Invalid announcement id");
    }
    const userId = request.headers.get("x-user-id")!;
    const user = await withRole(request, UserRole.MEMBER);
    logger.info("PATCH /api/announcements/[id] - User authorized", { traceId, userId, announcementId });

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError(
        "Only high role users can publish/archive announcements",
      );
    }

    const body = await request.json();
    const action = body.action;

    logger.info("PATCH /api/announcements/[id] - Processing action", { traceId, announcementId, action });

    if (action === "publish") {
      const announcement = await updateAnnouncement({
        announcementId,
        associationId: association.id,
        authorId: userId,
        data: {
          status: AnnouncementStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });
      logger.info("PATCH /api/announcements/[id] - Published", { traceId, announcementId });
      return SuccessResponse({ data: announcement });
    }

    if (action === "archive") {
      const announcement = await updateAnnouncement({
        announcementId,
        associationId: association.id,
        authorId: userId,
        data: {
          status: AnnouncementStatus.ARCHIVED,
        },
      });
      logger.info("PATCH /api/announcements/[id] - Archived", { traceId, announcementId });
      return SuccessResponse({ data: announcement });
    }

    if (action === "unpublish") {
      const announcement = await updateAnnouncement({
        announcementId,
        associationId: association.id,
        authorId: userId,
        data: {
          status: AnnouncementStatus.DRAFT,
          publishedAt: null,
        },
      });
      logger.info("PATCH /api/announcements/[id] - Unpublished", { traceId, announcementId });
      return SuccessResponse({ data: announcement });
    }

    throw new ForbiddenError(
      "Invalid action. Use: publish, archive, or unpublish",
    );
  },
);
