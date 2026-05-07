import axios, { AxiosInstance } from "axios";

import { env } from "~/env";

export const axiosClient: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  console.debug(`[Axios] -> ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});
