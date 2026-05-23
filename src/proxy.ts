import {
  chain,
  withAuth,
  withRateLimiting,
  withCors,
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
  withAuth,
  withCors,
  withSecurityHeaders,
  withLogging,
]);

export const config = {
  matcher: ["/api/:path*"],
};
