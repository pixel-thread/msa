import type { MiddlewareFn } from "./chain";

export const withLogging: MiddlewareFn = async (req, next, _event) => {
  const start = Date.now();
  const { method, url } = req;

  const response = await next(req);

  const duration = Date.now() - start;
  const status = response.status;

  console.info(`${method} ${url} - ${status} (${duration}ms)`);

  return response;
};
