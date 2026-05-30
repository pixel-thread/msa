/** Default page size for paginated queries. */
export const PAGE_SIZE = 10;

/**
 * File size limits (in bytes).
 */
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

/** @see MAX_IMAGE_SIZE */
export const MAX_VIDEO_SIZE = 20 * 1024 * 1024;

/** @see MAX_IMAGE_SIZE */
export const MAX_AUDIO_SIZE = 10 * 1024 * 1024;

/** @see MAX_IMAGE_SIZE */
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

/**
 * Allowed image file extensions.
 */
export const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;

/**
 * MIME types for allowed image formats.
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * Allowed video file extensions.
 */
export const ALLOWED_VIDEO_FORMATS = ['mp4', 'mov', 'wmv', 'avi', 'mkv'] as const;

/**
 * MIME types for allowed video formats.
 */
export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-ms-wmv',
  'video/x-msvideo',
  'video/x-matroska',
] as const;

/**
 * Allowed audio file extensions.
 */
export const ALLOWED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'flac', 'm4a'] as const;

/**
 * MIME types for allowed audio formats.
 */
export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/mp4',
] as const;

/**
 * Allowed document file extensions.
 */
export const ALLOWED_DOCUMENT_FORMATS = ['pdf', 'doc', 'docx'] as const;

/**
 * MIME types for allowed document formats.
 */
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/**
 * Combined list of all allowed file formats.
 */
export const ALLOWED_FILE_FORMATS = [
  ...ALLOWED_IMAGE_FORMATS,
  ...ALLOWED_VIDEO_FORMATS,
  ...ALLOWED_AUDIO_FORMATS,
  ...ALLOWED_DOCUMENT_FORMATS,
] as const;

/**
 * Combined list of all allowed MIME types.
 */
export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
  ...ALLOWED_AUDIO_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
] as const;
