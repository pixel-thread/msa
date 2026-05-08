import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { env } from "@src/env";

export const axiosClient: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
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
      const response = await axiosClient.post(
        "/auth/refresh",
        {},
        { withCredentials: true }
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
    console.debug(`[Axios] -> ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/") &&
      !originalRequest.url?.includes("/refresh")
    ) {
      originalRequest._retry = true;

      const refreshed = await attemptTokenRefresh();

      if (refreshed) {
        return axiosClient(originalRequest);
      }

      if (typeof window !== "undefined") {
        window.location.href = "/sign-in";
      }
    }

    return Promise.reject(error);
  }
);