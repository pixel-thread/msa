import { supabase } from "@src/shared/lib/supabase/client";
import { env } from "@src/env";
import { getStorageProvider } from "@src/shared/services/storage";

export interface UploadResult {
  key: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export async function uploadToBucket(
  file: File,
  pathPrefix: string,
): Promise<UploadResult> {
  const storage = getStorageProvider();
  const ext = file.name.split(".").pop() || "";
  const fileName = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
  const mimeType = file.type;
  const fileSize = file.size;

  const arrayBuffer = await file.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  const { key, url } = await storage.upload({
    fileBuffer: buffer,
    fileName: fileName,
    folder: pathPrefix,
    mimeType: mimeType,
  });

  return {
    mimeType,
    key,
    url,
    sizeBytes: fileSize,
  };
}

export async function deleteFromBucket(storageKey: string): Promise<void> {
  const bucket = env.STORAGE_BUCKET;
  const { error } = await supabase.storage.from(bucket).remove([storageKey]);
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
