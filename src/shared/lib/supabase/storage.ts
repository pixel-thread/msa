import { supabase } from "@src/shared/lib/supabase/client";
import { env } from "@src/env";
import { logger } from "@src/shared/logger";
import { BadRequestError } from "@src/shared/errors";

export interface UploadResult {
  id: string;
  path: string;
  fullPath: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  storedName: string;
}

export async function uploadToBucket(
  file: File,
  pathPrefix: string,
): Promise<UploadResult> {
  const bucket = env.SUPABASE_BUCKET;
  const ext = file.name.split(".").pop() || "";
  const storedName = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
  const storageKey = `${pathPrefix}/${storedName}`;

  const arrayBuffer = await file.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  const { error, data } = await supabase.storage
    .from(bucket)
    .upload(storageKey, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    logger.error("Failed to upload file", { error });
    throw new BadRequestError(`Failed to upload file: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storageKey);

  return {
    id: data.id,
    storageKey,
    url: publicUrlData.publicUrl,
    fullPath: data.fullPath,
    path: data.path,
    mimeType: file.type,
    sizeBytes: file.size,
    storedName,
  };
}

export async function deleteFromBucket(storageKey: string): Promise<void> {
  const bucket = env.SUPABASE_BUCKET;
  const { error } = await supabase.storage.from(bucket).remove([storageKey]);
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
