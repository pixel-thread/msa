import { healthPath } from "./paths/health";
import { meetingPaths } from "./paths/meeting";
import { attendeePaths } from "./paths/attendee";
import { adminPaths } from "./paths/admin";
import { subscriptionPaths } from "./paths/subscription";
import { memberPaths } from "./paths/members";

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
        description: "Enter your JWT token (from Clerk)",
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
    ...meetingPaths,
    ...attendeePaths,
    ...adminPaths,
    ...subscriptionPaths,
    ...memberPaths,
  },
};

export { healthPath } from "./paths/health";
export { meetingPaths } from "./paths/meeting";
export { attendeePaths } from "./paths/attendee";
export { adminPaths } from "./paths/admin";
export { subscriptionPaths } from "./paths/subscription";
export { memberPaths } from "./paths/members";