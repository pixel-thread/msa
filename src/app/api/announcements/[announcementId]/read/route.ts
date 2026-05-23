import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { markAnnouncementRead } from "@feature/announcement/services";
import { NextRequest } from "next/server";
import z from "zod";

const RouteParams = z.object({
  announcementId: z.uuid(),
});

export const POST = withAssociation(
  { params: RouteParams },
  async (association, { params }, request: NextRequest) => {
    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new Error("Invalid announcement id");
    }

    const userId = request.headers.get("x-user-id")!;
    await withRole(request, UserRole.MEMBER);

    const readReceipt = await markAnnouncementRead({
      announcementId,
      userId,
      associationId: association.id,
    });

    return SuccessResponse({
      data: readReceipt,
      message: "Announcement marked as read",
    });
  },
);
