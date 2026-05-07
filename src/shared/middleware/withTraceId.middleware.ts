import type { MiddlewareFn } from "./chain";

export const withTraceId: MiddlewareFn = async (req, next, _event) => {
  const traceId = req.headers.get("x-trace-id") ?? crypto.randomUUID();

  // Clone request headers to inject the trace ID
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-trace-id", traceId);

  // Create a cloned request with the new headers
  // Note: In Next.js middleware, we often just pass the modified headers to next()
  // if our chain utility supports it.

  // Actually, NextRequest is a bit special. Let's just mutate a Headers object
  // and pass it along if our chain handles it.
  // But NextRequest headers are immutable.

  // A better way in Next.js is to use the headers object directly in the final NextResponse.next()
  // So we just need to pass the updated headers along.

  const response = await next(
    new Proxy(req, {
      get(target, prop, receiver) {
        if (prop === "headers") return requestHeaders;
        return Reflect.get(target, prop, receiver);
      },
    }),
  );

  response.headers.set("x-trace-id", traceId);
  return response;
};
