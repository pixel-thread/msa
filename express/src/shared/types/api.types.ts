/** A single validation issue with an optional error code. */
export interface ValidationIssue {
  field: string;
  message: string;
  code?: string;
}

/** Structured API error payload. */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown | undefined;
  traceId?: string | undefined;
}

/** Envelope wrapping an unsuccessful API response. */
export interface ErrorEnvelope {
  success: false;
  error: ApiError;
}

/** Pagination metadata included in list responses. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/** @see PaginationMeta */
export type ResponseMeta = PaginationMeta;

/** Envelope wrapping a successful API response with optional metadata. */
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: ResponseMeta | undefined;
  message?: string | undefined;
}

/** Union type for all API response envelopes. */
export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;
