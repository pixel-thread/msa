export interface ValidationIssue {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown | undefined;
  traceId?: string | undefined;
}

export interface ErrorEnvelope {
  success: false;
  error: ApiError;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export type ResponseMeta = PaginationMeta;

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: ResponseMeta | undefined;
  message?: string | undefined;
}

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;
