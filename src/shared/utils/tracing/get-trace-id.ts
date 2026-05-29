export const getTraceId = (request: Request) =>
  request.headers.get('x-trace-id') ?? crypto.randomUUID();
