import {
  NextResponse,
  type NextFetchEvent,
  type NextProxy as NextMiddleware,
  type NextRequest,
} from 'next/server';
import { AppErrorResponse, getTraceId } from '../utils';
import { normalizeUnknownError } from '../errors';

export type MiddlewareFn = (
  req: NextRequest,
  next: (req: NextRequest) => Promise<NextResponse>,
  event: NextFetchEvent,
) => Promise<NextResponse>;

export function chain(middlewares: MiddlewareFn[]): NextMiddleware {
  return async (req, event) => {
    const traceId = getTraceId(req);
    try {
      const execute = async (index: number, currentReq: NextRequest): Promise<NextResponse> => {
        if (index >= middlewares.length) {
          // This is the terminal case.
          // We use the headers from the final currentReq to ensure they reach the route handler.
          return NextResponse.next({
            request: {
              headers: currentReq.headers,
            },
          });
        }

        const middleware = middlewares[index];
        if (!middleware) return execute(index + 1, currentReq);

        return middleware(currentReq, (nextReq) => execute(index + 1, nextReq), event);
      };

      return execute(0, req);
    } catch (error) {
      const appError = normalizeUnknownError(error);
      return AppErrorResponse(appError, traceId);
    }
  };
}
