import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole, AnnouncementStatus } from "@prisma/client";
import {
  updateAnnouncement,
  deleteAnnouncement,
  findUniqueAnnouncement,
} from "@feature/announcement/services";
import { UpdateAnnouncementSchema } from "@feature/announcement/validators";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";
import { NextRequest } from "next/server";
import z from "zod";

const RouteParams = z.object({
  announcementId: z.uuid(),
});

export const GET = withAssociation(
  { params: RouteParams },
  async (association, { params }, request) => {
    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError("Invalid announcement id");
    }

    await withRole(request, UserRole.MEMBER);

    const announcement = await findUniqueAnnouncement({
      announcementId,
      associationId: association.id,
    });

    return SuccessResponse({ data: announcement });
  },
);

export const PUT = withAssociation(
  { body: UpdateAnnouncementSchema, params: RouteParams },
  async (association, { body, params }, request: NextRequest) => {
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError("Invalid announcement id");
    }

    const userId = request.headers.get("x-user-id")!;
    const user = await withRole(request, UserRole.MEMBER);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError("Only high role users can update announcements");
    }

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

    return SuccessResponse({ data: announcement });
  },
);

export const DELETE = withAssociation(
  { params: RouteParams },
  async (association, { params }, request: NextRequest) => {
    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError("Invalid announcement id");
    }
    const userId = request.headers.get("x-user-id")!;
    const user = await withRole(request, UserRole.MEMBER);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError("Only high role users can delete announcements");
    }

    await deleteAnnouncement({
      announcementId,
      associationId: association.id,
      authorId: userId,
    });

    return SuccessResponse({ data: { success: true } });
  },
);

export const PATCH = withAssociation(
  { params: RouteParams },
  async (
    association,

    { params },
    request,
  ) => {
    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError("Invalid announcement id");
    }
    const userId = request.headers.get("x-user-id")!;
    const user = await withRole(request, UserRole.MEMBER);

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError(
        "Only high role users can publish/archive announcements",
      );
    }

    const body = await request.json();
    const action = body.action;

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
      return SuccessResponse({ data: announcement });
    }

    throw new ForbiddenError(
      "Invalid action. Use: publish, archive, or unpublish",
    );
  },
);

