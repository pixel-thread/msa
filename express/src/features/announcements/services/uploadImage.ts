import { env } from '@src/env';
import { prisma } from '@lib/prisma';

import { NotFoundError } from '@src/shared/errors';
import { uploadToBucket } from '@src/shared/lib/supabase/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for uploading an image to an announcement. */
interface UploadImageProps {
  /** The announcement to attach the image to. */
  announcementId: string;
  /** The association scoping the upload. */
  associationId: string;
  /** The image file to upload. */
  file: File;
  /** The user uploading the file. */
  uploadedById: string;
}

// ---------------------------------------------------------------------------
// Upload announcement image
// ---------------------------------------------------------------------------

/**
 * Upload an image for an announcement.
 * Replaces any existing image by deleting the old file record and storage key.
 */
export async function uploadAnnouncementImage({
  announcementId,
  associationId,
  file,
  uploadedById,
}: UploadImageProps) {
  // Verify the announcement exists and fetch its current image (if any)
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, associationId },
    include: { imageFile: true },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  const oldFileId = announcement.imageFileId;
  const oldStorageKey = announcement.imageFile?.storageKey;

  // Resolve the association slug for the storage path
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: { slug: true },
  });

  // Upload the new image to object storage
  const uploadResult = await uploadToBucket(
    file,
    `announcements/${association?.slug ?? associationId}/${announcementId}`,
  );

  // Create a file record for the uploaded image
  const fileRecord = await prisma.file.create({
    data: {
      associationId,
      originalName: file.name,
      storedName: uploadResult.key,
      mimeType: uploadResult.mimeType,
      extension: file.name.split('.').pop() || null,
      sizeBytes: uploadResult.sizeBytes,
      bucket: env.STORAGE_BUCKET,
      storageKey: uploadResult.key,
      url: uploadResult.url,
      uploadedById,
    },
  });

  // Attach the new image to the announcement
  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      imageUrl: uploadResult.url,
      imageFileId: fileRecord.id,
    },
    include: { imageFile: true },
  });

  // Clean up the old file record if one existed
  if (oldFileId) {
    await prisma.file.delete({ where: { id: oldFileId } });
  }

  return { announcement: updated, oldStorageKey };
}
