import { supabase } from '@src/shared/lib/supabase/client';
import { env } from '@src/env';
import { getStorageProvider } from '@src/shared/services/storage';
import { logger } from '@src/shared/logger';

/** Result of a file upload containing key, URL, MIME type, and size. */
export interface UploadResult {
  key: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/** Uploads a file to the configured storage provider. Returns the upload result metadata. */
export async function uploadToBucket(
  file: File,
  pathPrefix: string,
  traceId?: string,
): Promise<UploadResult> {
  const storage = getStorageProvider();
  const ext = file.name.split('.').pop() || '';
  const fileName = `${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
  const mimeType = file.type;
  const fileSize = file.size;

  const arrayBuffer = await file.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  logger.info(
    {
      traceId,
      fileName,
      mimeType,
      fileSize,
      storage: env.STORAGE_PROVIDER,
    },
    'Uploading file started',
  );

  const { key, url } = await storage.upload({
    fileBuffer: buffer,
    fileName: fileName,
    folder: pathPrefix,
    mimeType: mimeType,
  });

  logger.info(
    {
      traceId,
      fileName,
      mimeType,
      fileSize,
      storage: env.STORAGE_PROVIDER,
    },
    'Uploading file completed',
  );
  return {
    mimeType,
    key,
    url,
    sizeBytes: fileSize,
  };
}

/** Deletes a file from Supabase storage by its storage key. */
export async function deleteFromBucket(storageKey: string): Promise<void> {
  const bucket = env.STORAGE_BUCKET;
  const { error } = await supabase.storage.from(bucket).remove([storageKey]);
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
