import { UserRole } from "@prisma/client";
import { withValidation } from "@src/shared/api";
import { withRole } from "@src/shared/api/with-role";
import { ForbiddenError } from "@src/shared/errors";
import { updateNotificationStatus } from "@src/shared/services/notification";
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

    if (userId !== body?.userId) {
      throw new ForbiddenError("Cannot update other user notificaiton");
    }

    const notification = await updateNotificationStatus({
      where: { id: params?.notificationId },
      data: {
        isRead: body.isRead,
        readAt: body.readAt,
        isRecived: body.isRecived,
        recivedAt: body.recevidAt,
      },
    });

    return SuccessResponse({
      data: notification,
      message: "Successfully updated notification status",
    });
  },
);
