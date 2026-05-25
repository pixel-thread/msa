import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { env } from "@src/env";
import { logger } from "@src/shared/logger";
import cookie from "react-cookies";

export const axiosClient: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
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
      logger.debug("[Axios] Attempting token refresh");
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
    logger.debug(`[Axios] -> ${config.method?.toUpperCase()} ${config.url}`);
    const token = cookie.load("csrf-token");
    if (token) {
      config.headers["X-CSRF-Token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    logger.debug("[Axios] Error caught:", {
      isAxiosError: axios.isAxiosError(error),
      hasResponse: !!error.response,
      hasRequest: !!error.request,
      status: error.response?.status,
      message: error.message,
    });

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    logger.debug("[Axios] Original request:", {
      url: originalRequest?.url,
      method: originalRequest?.method,
      hasConfig: !!originalRequest,
      retry: originalRequest?._retry,
    });

    if (
      error.response?.status === 403 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const token = cookie.load("csrf-token");
      if (token) {
        originalRequest.headers["X-CSRF-Token"] = token;
        return axiosClient(originalRequest);
      }
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      const url = originalRequest.url || "";
      // Only skip refresh for actual auth actions, not for identity checks like /auth/me
      const isAuthAction =
        url.includes("/auth/sign-in") ||
        url.includes("/auth/sign-up") ||
        url.includes("/auth/refresh");

      logger.debug("[Axios] Checking 401:", { url, isAuthAction });

      if (isAuthAction) {
        logger.debug("[Axios] Skipping retry for auth action");
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      logger.debug("[Axios] Attempting token refresh for:", { url });

      const refreshed = await attemptTokenRefresh();

      logger.debug("[Axios] Refresh result:", { refreshed });

      if (refreshed) {
        logger.debug("[Axios] Retrying original request");
        return axiosClient(originalRequest);
      }

      logger.debug("[Axios] Refresh failed");
    }

    return Promise.reject(error);
  },
);
