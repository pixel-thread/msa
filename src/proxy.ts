import {
  chain,
  withAuth,
  withRateLimiting,
  withCors,
  withLogging,
} from "./shared/middleware";

export default chain([withRateLimiting, withAuth, withCors, withLogging]);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
