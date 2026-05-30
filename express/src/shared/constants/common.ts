export const PAGE_SIZE = 10;

// ======================================================
// FILE SIZE LIMITS
// ======================================================

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

// ======================================================
// IMAGE
// ======================================================

export const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

// ======================================================
// VIDEO
// ======================================================

export const ALLOWED_VIDEO_FORMATS = ['mp4', 'mov', 'wmv', 'avi', 'mkv'] as const;

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime', // mov
  'video/x-ms-wmv',
  'video/x-msvideo', // avi
  'video/x-matroska', // mkv
] as const;

// ======================================================
// AUDIO
// ======================================================

export const ALLOWED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'flac', 'm4a'] as const;

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg', // mp3
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/mp4', // m4a
] as const;

// ======================================================
// DOCUMENTS
// ======================================================

export const ALLOWED_DOCUMENT_FORMATS = ['pdf', 'doc', 'docx'] as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

// ======================================================
// GLOBAL
// ======================================================

export const ALLOWED_FILE_FORMATS = [
  ...ALLOWED_IMAGE_FORMATS,
  ...ALLOWED_VIDEO_FORMATS,
  ...ALLOWED_AUDIO_FORMATS,
  ...ALLOWED_DOCUMENT_FORMATS,
] as const;

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
  ...ALLOWED_AUDIO_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
] as const;
