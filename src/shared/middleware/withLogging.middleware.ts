import type { MiddlewareFn } from "./chain";
import { normalizeUnknownError } from "../errors";

export const withLogging: MiddlewareFn = async (req, next, _event) => {
  const start = Date.now();
  const { method, url } = req;

  try {
    const response = await next(req);
    const duration = Date.now() - start;
    const status = response.status;

    console.info(`${method} ${url} - ${status} (${duration}ms)`);

    return response;
  } catch (error) {
    const duration = Date.now() - start;
    const appError = normalizeUnknownError(error);
    
    console.error(`${method} ${url} - ${appError.statusCode} ERROR (${duration}ms) - ${appError.message}`);
    
    throw error;
  }
};
