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
  withCors,
  withCsrf,
  withRateLimiting,
  withAuth,
  withSecurityHeaders,
  withRequestSizeLimit,
  withBotProtection,
  withLogging,
]);

export const config = {
  matcher: ["/api/:path*"],
};
