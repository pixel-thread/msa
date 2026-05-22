import { FileType } from "@prisma/client";

export function mimeToFileType(mimeType: string): FileType {
  if (mimeType.startsWith("image/")) return FileType.IMAGE;
  if (mimeType === "application/pdf") return FileType.PDF;
  if (mimeType.startsWith("video/")) return FileType.VIDEO;
  return FileType.DOCUMENT;
}
