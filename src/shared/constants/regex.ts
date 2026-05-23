/**
 * Regular expression patterns for Zod validation schemas.
 * Split into ALLOW (positive validation) and DENY (negative validation).
 *
 * ALLOW — input must match the pattern to be accepted.
 * DENY  — input must NOT match the pattern; if it does, reject.
 */

export const ALLOW = {
  EMAIL: /^[\w.%+-]+@[a-zA-Z\d-]+\.[a-zA-Z]{2,}$/,

  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,

  PHONE_IN: /^\+91[6-9]\d{9}$/,

  PHONE_INTL: /^\+\d{1,3}\d{6,14}$/,

  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,

  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  MONTH_NUMBER: /^(0?[1-9]|1[0-2])$/,

  YEAR_4DIGIT: /^\d{4}$/,

  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,

  ALPHANUMERIC_SPACE: /^[a-zA-Z0-9\s]+$/,

  ALPHABET_ONLY: /^[a-zA-Z\s]+$/,

  NUMERIC_ONLY: /^\d+$/,

  TEXT_ONLY: /^[^\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]+$/,

  UPPERCASE_ONLY: /^[A-Z\s]+$/,

  LOWERCASE_ONLY: /^[a-z\s]+$/,

  SIGNS_ONLY: /^[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]+$/,

  HEX_COLOR: /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,

  BASE64_IMAGE: /^data:image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,/,

  JWT: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,

  OTP_6DIGIT: /^\d{6}$/,

  CREDIT_CARD: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,

  IFSC_CODE: /^[A-Z]{4}0[A-Z0-9]{6}$/,

  GSTIN: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/,

  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,

  ADHAAR: /^\d{4}\s?\d{4}\s?\d{4}$/,
};

export const DENY = {
  HTML_TAGS: /<[^>]*>/,

  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)|(--)|(;)|(')/i,

  XSS_SCRIPT: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
};
