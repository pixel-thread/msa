import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { BadRequestError, ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { uploadAnnouncementImage } from "@feature/announcement/services";
import { deleteFromBucket } from "@src/shared/lib/supabase/storage";
import { z } from "zod";
import { logger } from "@src/shared/logger";

const RouteParams = z.object({
  announcementId: z.uuid(),
});

export const POST = withAssociation(
  { params: RouteParams },
  async (association, { params }, request) => {
    const announcementId = params?.announcementId;
    if (!announcementId) {
      throw new ForbiddenError("Invalid announcement id");
    }

    const user = await withRole(request, UserRole.SECRETARY);

    const formData = await request.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      throw new BadRequestError("File is required");
    }

    if (!file.size || file.size === 0) {
      throw new BadRequestError("File is empty");
    }

    if (!file.type.startsWith("image/")) {
      throw new BadRequestError("Only image files are allowed");
    }

    const { announcement, oldStorageKey } = await uploadAnnouncementImage({
      announcementId,
      associationId: association.id,
      file,
      uploadedById: user.id,
    });

    if (oldStorageKey) {
      try {
        await deleteFromBucket(oldStorageKey);
      } catch (error) {
        // Best-effort cleanup
        logger.error("Failed to delete old image", {
          error,
        });
      }
    }

    return SuccessResponse({ data: announcement }, 200);
  },
);
