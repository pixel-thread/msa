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
  withLogging,
  withRateLimiting,
  withRequestSizeLimit,
  withBotProtection,
  withCsrf,
  withAuth,
]);

export const config = {
  matcher: ["/api/:path*"],
};
