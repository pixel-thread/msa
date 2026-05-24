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
  withCors,
  withSecurityHeaders,
  withTraceId,
  withRateLimiting,
  withRequestSizeLimit,
  withBotProtection,
  withCsrf,
  withAuth,
  withLogging,
]);

export const config = {
  matcher: ["/api/:path*"],
};
