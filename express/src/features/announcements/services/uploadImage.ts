/**
 * @file uploadImage.ts
 * @description Service for uploading and attaching an image to an announcement.
 *
 * @module features/announcements/services
 */

import { env } from '@src/env';
import { prisma } from '@lib/prisma';

import { NotFoundError } from '@src/shared/errors';
import { uploadToBucket } from '@src/shared/lib/supabase/storage';

/**
 * Props for uploading an image to an announcement.
 *
 * @interface UploadImageProps
 */
export interface UploadImageProps {
  /** The unique ID of the announcement to attach the image to. */
  announcementId: string;

  /** The ID of the association scoping the upload. */
  associationId: string;

  /** The image file object to upload. */
  file: File;

  /** The ID of the user performing the upload. */
  uploadedById: string;
}

/**
 * Upload an image for an announcement.
 *
 * This service uploads the provided file to object storage, creates a corresponding
 * file record in the database, and updates the announcement with the new image URL.
 * It also returns the old storage key so that the previous image can be cleaned up.
 *
 * @param {UploadImageProps} props - The upload properties.
 * @returns {Promise<{ announcement: any, oldStorageKey?: string }>} The updated announcement and old storage key.
 * @throws {NotFoundError} If the announcement is not found.
 */
export async function uploadAnnouncementImage({
  announcementId,
  associationId,
  file,
  uploadedById,
}: UploadImageProps) {
  // 1. Verification: Ensure the announcement exists and fetch its current image (if any)
  const announcement = await prisma.announcement.findFirst({
    where: {
      id: announcementId,
      associationId,
    },
    include: {
      imageFile: true,
    },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  const oldFileId = announcement.imageFileId;
  const oldStorageKey = announcement.imageFile?.storageKey;

  // 2. Storage: Resolve the association slug for the storage path
  const association = await prisma.association.findUnique({
    where: {
      id: associationId,
    },
    select: {
      slug: true,
    },
  });

  // 3. Storage: Upload the new image to object storage
  const uploadResult = await uploadToBucket(
    file,
    `announcements/${association?.slug ?? associationId}/${announcementId}`,
  );

  // 4. Persistence: Create a file record for the uploaded image
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

  // 5. Persistence: Attach the new image to the announcement
  const updated = await prisma.announcement.update({
    where: {
      id: announcementId,
    },
    data: {
      imageUrl: uploadResult.url,
      imageFileId: fileRecord.id,
    },
    include: {
      imageFile: true,
    },
  });

  // 6. Cleanup: Remove the old file record if one existed
  if (oldFileId) {
    await prisma.file.delete({
      where: {
        id: oldFileId,
      },
    });
  }

  return {
    announcement: updated,
    oldStorageKey,
  };
}
