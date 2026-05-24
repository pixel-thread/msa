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
  withRateLimiting,
  withAuth,
  withSecurityHeaders,
  withRequestSizeLimit,
  withBotProtection,
  withCsrf,
  withLogging,
]);

export const config = {
  matcher: ["/api/:path*"],
};
