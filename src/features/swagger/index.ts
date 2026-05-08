import { healthPath } from "./paths/health";
import { meetingPaths } from "./paths/meeting";
import { attendeePaths } from "./paths/attendee";
import { adminPaths } from "./paths/admin";
import { subscriptionPaths } from "./paths/subscription";
import { memberPaths } from "./paths/members";
import { authPaths } from "./paths/auth";

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "MFSA API",
    version: "1.0.0",
    description: "API documentation for MFSA",
  },
  servers: [
    {
      url: "/api",
      description: "Current API",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token. Get it from /auth/sign-in",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    ...healthPath,
    ...authPaths,
    ...meetingPaths,
    ...attendeePaths,
    ...adminPaths,
    ...subscriptionPaths,
    ...memberPaths,
  },
};

export { healthPath } from "./paths/health";
export { authPaths } from "./paths/auth";
export { meetingPaths } from "./paths/meeting";
export { attendeePaths } from "./paths/attendee";
export { adminPaths } from "./paths/admin";
export { subscriptionPaths } from "./paths/subscription";
export { memberPaths } from "./paths/members";