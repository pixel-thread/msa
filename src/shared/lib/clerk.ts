import { createClerkClient } from "@clerk/nextjs/server";

import { env } from "~/env";

export const clerk = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});
