import { UserRole } from "@prisma/client";
import { withValidation, withRole } from "@src/shared/api";
import { NotFoundError, UnauthorizedError } from "@src/shared/errors";
import {
  findUniqueNotification,
  updateNotificationStatus,
} from "@src/shared/services/notification";
import { SuccessResponse } from "@src/shared/utils";
import {
  NotificationRouteParams,
  UpdateNotificationSchema,
} from "@src/shared/validators/notification";

export const PATCH = withValidation(
  { body: UpdateNotificationSchema, params: NotificationRouteParams },

  async (req, _ctx, { params, body }) => {
    await withRole(req, UserRole.MEMBER);

    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

    const isNotificaitonExist = await findUniqueNotification({
      where: { id: params?.notificationId, userId },
    });

    if (!isNotificaitonExist) {
      throw new NotFoundError("Notification not found.");
    }

    const payload = {
      isRead: body?.isRead,
      isReceived: body?.isReceived,
      readAt: body?.isRead ? new Date() : null,
      receivedAt: body?.isReceived ? new Date() : null,
    };

    const notification = await updateNotificationStatus({
      where: { id: params?.notificationId },
      data: payload,
    });

    return SuccessResponse({
      data: notification,
      message: "Successfully updated notification status",
    });
  },
);
