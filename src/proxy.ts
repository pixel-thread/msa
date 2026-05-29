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
} from './shared/middleware';
import { withSleep } from './shared/middleware/with-sleep.middleware';

export default chain([
  withSleep,
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
  matcher: ['/api/:path*'],
};
