import {
  chain,
  withAuth,
  withCors,
  withLogging,
  withSecurityHeaders,
} from "./shared/middleware";

export default chain([withAuth, withCors, withSecurityHeaders, withLogging]);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
