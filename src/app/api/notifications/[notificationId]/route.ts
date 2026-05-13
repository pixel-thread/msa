import { UserRole } from "@prisma/client";
import { withValidation } from "@src/shared/api";
import { withRole } from "@src/shared/api/with-role";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@src/shared/errors";
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

    const notification = await updateNotificationStatus({
      where: { id: params?.notificationId },
      data: {
        isRead: body?.isRead,
        readAt: body?.readAt,
        isRecived: body?.isRecived,
        recivedAt: body?.recevidAt,
      },
    });

    return SuccessResponse({
      data: notification,
      message: "Successfully updated notification status",
    });
  },
);
