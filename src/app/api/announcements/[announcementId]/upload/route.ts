import { withRole } from "@src/shared/api";
import { withAssociationFormData } from "@src/shared/api/with-form-data-validation";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { uploadAnnouncementImage } from "@feature/announcement/services";
import { deleteFromBucket } from "@src/shared/lib/supabase/storage";
import { z } from "zod";
import { logger } from "@src/shared/logger";
import {
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_FORMATS,
  ALLOWED_MIME_TYPES,
} from "@src/shared/constants";

const RouteParams = z.object({
  announcementId: z.uuid(),
});

const UploadFormData = z.object({
  file: z
    .instanceof(File, { message: "File is required" })
    .refine((f) => f.size < MAX_IMAGE_SIZE, { message: "File is too large" })
    .refine((f) => f.type, { message: "File type is required" })
    .refine((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return extension && ALLOWED_IMAGE_FORMATS.includes(extension as never);
    }, "Invalid file extension")
    .refine((f) => ALLOWED_MIME_TYPES.includes(f.type as never), {
      message: "File type is not allowed",
    })
    .refine((f) => f.size > 0, { message: "File is empty" })
    .refine(
      (f) => /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)?$/.test(f.name),
      "File name contains special characters. only a-z, A-Z, 0-9 and _ are allowed",
    )
    .refine((f) => f.type.startsWith("image/"), {
      message: "Only image files are allowed",
    }),
});

export const POST = withAssociationFormData(
  {
    formData: UploadFormData,
    params: RouteParams,
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
