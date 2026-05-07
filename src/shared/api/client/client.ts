import type { ErrorEnvelope, SuccessEnvelope } from "~/shared/types";

type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export interface ApiClientOptions {
  baseUrl: string;
  defaultHeaders?: HeadersInit;
  fetch?: typeof fetch;
  getAuthToken?: () => Promise<string | null> | string | null;
  getTraceId?: () => string;
}

export interface RequestOptions<TBody = undefined> {
  body?: TBody;
  cache?: RequestCache;
  headers?: HeadersInit;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
    public readonly traceId?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isErrorEnvelope = (value: unknown): value is ErrorEnvelope =>
  isRecord(value) && value.success === false && "error" in value;

const isSuccessEnvelope = <T>(value: unknown): value is SuccessEnvelope<T> =>
  isRecord(value) && value.success === true && "data" in value;

const ensureTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

const createUrl = (
  baseUrl: string,
  pathname: string,
  query?: Record<string, QueryValue>,
) => {
  const url = new URL(pathname, ensureTrailingSlash(baseUrl));

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        url.searchParams.append(key, String(entry));
      }
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
};

const parseResponsePayload = async (response: Response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as unknown;
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
};

const getDefaultErrorCode = (status: number) => {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHENTICATED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMITED";
    default:
      return "INTERNAL_ERROR";
  }
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.trim();
    this.fetchImpl = options.fetch ?? globalThis.fetch;
  }

  private async buildHeaders(headers?: HeadersInit) {
    const result = new Headers(this.options.defaultHeaders);
    result.set("accept", "application/json");

    const token = await this.options.getAuthToken?.();
    if (token) {
      result.set("authorization", `Bearer ${token}`);
    }

    const traceId = this.options.getTraceId?.();
    if (traceId) {
      result.set("x-correlation-id", traceId);
    }

    for (const [key, value] of new Headers(headers).entries()) {
      result.set(key, value);
    }

    return result;
  }

  async request<TResponse, TBody = undefined>(
    method: string,
    pathname: string,
    options: RequestOptions<TBody> = {},
  ) {
    const url = createUrl(this.baseUrl, pathname, options.query);
    const headers = await this.buildHeaders(options.headers);
    const hasBody = options.body !== undefined;

    if (hasBody && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await this.fetchImpl(url, {
      method,
      headers,
      cache: options.cache,
      signal: options.signal,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });

    const payload = await parseResponsePayload(response);

    if (!response.ok) {
      if (isErrorEnvelope(payload)) {
        throw new ApiClientError(
          payload.error.message,
          response.status,
          payload.error.code,
          payload.error.details,
          payload.error.traceId ??
            response.headers.get("x-trace-id") ??
            undefined,
        );
      }

      throw new ApiClientError(
        response.statusText || "Request failed",
        response.status,
        getDefaultErrorCode(response.status),
        payload,
        response.headers.get("x-trace-id") ?? undefined,
      );
    }

    if (isSuccessEnvelope<TResponse>(payload)) {
      return payload.data;
    }

    return payload as TResponse;
  }

  get<TResponse>(pathname: string, options?: Omit<RequestOptions, "body">) {
    return this.request<TResponse>("GET", pathname, options);
  }

  post<TResponse, TBody>(pathname: string, options?: RequestOptions<TBody>) {
    return this.request<TResponse, TBody>("POST", pathname, options);
  }

  patch<TResponse, TBody>(pathname: string, options?: RequestOptions<TBody>) {
    return this.request<TResponse, TBody>("PATCH", pathname, options);
  }

  delete<TResponse>(pathname: string, options?: Omit<RequestOptions, "body">) {
    return this.request<TResponse>("DELETE", pathname, options);
  }
}
