import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { env } from '@src/env';
import { logger } from '@src/shared/logger';
import cookie from 'react-cookies';

type ExtendedConfig = InternalAxiosRequestConfig & { __startTime?: number };

export const axiosClient: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return refreshPromise ?? Promise.resolve(false);
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await axios.post(
        `${env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      return response.data?.success === true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const traceId = crypto.randomUUID();
    const method = (config.method?.toUpperCase() ?? 'UNKNOWN') as string;
    const path = config.url ?? '';

    config.headers['x-trace-id'] = traceId;
    config.headers['x-platform'] = 'web';
    config.headers['x-os-version'] = 'unknown';
    config.headers['x-client-version'] = 'unknown';
    config.headers['x-device-type'] = 'web';
    config.headers['x-association-slug'] = env.NEXT_PUBLIC_ASSOCIATION_SLUG || 'unknown';

    const token = cookie.load('csrf-token');
    if (token) {
      config.headers['X-CSRF-Token'] = token;
    }

    (config as ExtendedConfig).__startTime = Date.now();

    logger.info(`[→ ${method}] ${path}`, {
      traceId,
    });

    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => {
    const config = response.config as ExtendedConfig;
    const method = (config.method?.toUpperCase() ?? 'UNKNOWN') as string;
    const path = config.url ?? '';
    const duration = config.__startTime ? Date.now() - config.__startTime : 0;
    const traceId = (config.headers?.['x-trace-id'] as string) ?? '';

    logger.info(`[← ${method}] ${path} — ${response.status} (${duration}ms)`, {
      traceId,
      status: response.status,
      durationMs: duration,
    });

    return response;
  },
  async (error) => {
    const originalRequest = error.config as ExtendedConfig & { _retry?: boolean };
    const method = (originalRequest?.method?.toUpperCase() ?? 'UNKNOWN') as string;
    const path = originalRequest?.url ?? '';
    const duration = originalRequest?.__startTime ? Date.now() - originalRequest.__startTime : 0;
    const traceId = (originalRequest?.headers?.['x-trace-id'] as string) ?? '';
    const status = error.response?.status ?? 0;
    const errorMessage = error.message;

    logger.error(`[← ${method}] ${path} — ${status} (${duration}ms) — ${errorMessage}`, {
      traceId,
      status,
      durationMs: duration,
      error: errorMessage,
    });

    if (status === 403 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const token = cookie.load('csrf-token');
      if (token) {
        originalRequest.headers['X-CSRF-Token'] = token;
        return axiosClient(originalRequest);
      }
    }

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url || '';
      const isAuthAction =
        url.includes('/auth/sign-in') ||
        url.includes('/auth/sign-up') ||
        url.includes('/auth/refresh');

      if (isAuthAction) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const refreshed = await attemptTokenRefresh();

      if (refreshed) {
        return axiosClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
