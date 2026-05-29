import { MiddlewareFn } from './chain';

export const withTraceId: MiddlewareFn = async (req, next) => {
  const traceId = req.headers.get('x-trace-id') ?? crypto.randomUUID();

  const response = await next(req);

  response.headers.set('x-trace-id', traceId);
  return response;
};
