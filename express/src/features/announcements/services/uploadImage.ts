import { env } from '@src/env';
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';
import { uploadToBucket } from '@src/shared/lib/supabase/storage';

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

/** Upload an image for an announcement. Replaces any existing image. */
export async function uploadAnnouncementImage({
  announcementId,
  associationId,
  file,
  uploadedById,
}: UploadImageProps) {
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, associationId },
    include: { imageFile: true },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  const oldFileId = announcement.imageFileId;
  const oldStorageKey = announcement.imageFile?.storageKey;

  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: { slug: true },
  });

  const uploadResult = await uploadToBucket(
    file,
    `announcements/${association?.slug ?? associationId}/${announcementId}`,
  );

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

  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      imageUrl: uploadResult.url,
      imageFileId: fileRecord.id,
    },
    include: { imageFile: true },
  });

  if (oldFileId) {
    await prisma.file.delete({ where: { id: oldFileId } });
  }

  return { announcement: updated, oldStorageKey };
}
