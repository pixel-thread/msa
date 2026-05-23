import { withRole } from "@src/shared/api";
import { withAssociationFormData } from "@src/shared/api/with-form-data-validation";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { uploadAnnouncementImage } from "@feature/announcement/services";
import { deleteFromBucket } from "@src/shared/lib/supabase/storage";
import { logger } from "@src/shared/logger";
import {
  AnnouncementRouteParams,
  AnnouncementUploadFormData,
} from "@src/features/announcement";

export const POST = withAssociationFormData(
  {
    formData: AnnouncementUploadFormData,
    params: AnnouncementRouteParams,
  },
  async (association, { formData, params }, request) => {
    const user = await withRole(request, UserRole.SECRETARY);

    const { announcement, oldStorageKey } = await uploadAnnouncementImage({
      announcementId: params!.announcementId,
      associationId: association.id,
      file: formData.file,
      uploadedById: user.id,
    });

    if (oldStorageKey) {
      try {
        await deleteFromBucket(oldStorageKey);
      } catch (error) {
        logger.error("Failed to delete old image", { error });
      }
    }

    return SuccessResponse({ data: announcement }, 200);
  },
);
