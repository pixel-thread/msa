import type { MiddlewareFn } from './chain';
import { normalizeUnknownError } from '../errors';
import { AppErrorResponse, getTraceId } from '../utils';

export const withLogging: MiddlewareFn = async (req, next, _event) => {
  try {
    const response = await next(req);
    // const duration = Date.now() - start;
    // const status = response.status;

    // logger.debug({},`${method} ${url} - ${status} (${duration}ms)`,);

    return response;
  } catch (error) {
    const traceId = getTraceId(req);
    const appError = normalizeUnknownError(error);

    return AppErrorResponse(appError, traceId);
  }
};
