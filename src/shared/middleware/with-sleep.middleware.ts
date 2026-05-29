import type { MiddlewareFn } from "./chain";
import { normalizeUnknownError } from "../errors";
import { AppErrorResponse, getTraceId } from "../utils";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const withSleep: MiddlewareFn = async (req, next) => {
  try {
    if (process.env.NODE_ENV === "development") {
      await sleep(2000);
    }

    const response = await next(req);
    return response;
  } catch (error) {
    const traceId = getTraceId(req);
    const appError = normalizeUnknownError(error);

    return AppErrorResponse(appError, traceId);
  }
};
