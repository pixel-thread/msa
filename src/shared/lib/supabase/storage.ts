import { supabase } from ".";
import { env } from "@src/env";
import { FileType } from "@prisma/client";

export interface UploadResult {
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  storedName: string;
}

export function mimeToFileType(mimeType: string): FileType {
  if (mimeType.startsWith("image/")) return FileType.IMAGE;
  if (mimeType === "application/pdf") return FileType.PDF;
  if (mimeType.startsWith("video/")) return FileType.VIDEO;
  return FileType.DOCUMENT;
}

export async function uploadToBucket(
  file: File,
  pathPrefix: string,
): Promise<UploadResult> {
  const bucket = env.SUPABASE_BUCKET;
  const ext = file.name.split(".").pop() || "";
  const storedName = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
  const storageKey = `${pathPrefix}/${storedName}`;

  const { error } = await supabase.storage.from(bucket).upload(storageKey, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storageKey);

  return {
    storageKey,
    url: publicUrlData.publicUrl,
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
