import {
  chain,
  withAuth,
  withRateLimiting,
  withCors,
  withLogging,
  withSecurityHeaders,
} from "./shared/middleware";

export default chain([
  withRateLimiting,
  withAuth,
  withCors,
  withSecurityHeaders,
  withLogging,
]);

export const config = {
  matcher: ["/api/:path*"],
};
