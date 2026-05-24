import {
  chain,
  withAuth,
  withRateLimiting,
  withCors,
  withCsrf,
  withLogging,
  withSecurityHeaders,
  withBotProtection,
  withRequestSizeLimit,
  withTraceId,
} from "./shared/middleware";

export default chain([
  withTraceId,
  withRateLimiting,
  withRequestSizeLimit,
  withBotProtection,
  withCsrf,
  withAuth,
  withCors,
  withSecurityHeaders,
  withLogging,
]);

export const config = {
  matcher: ["/api/:path*"],
};
