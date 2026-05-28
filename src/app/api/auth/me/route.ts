import { SuccessResponse } from "@src/shared/utils";
import { UnauthorizedError } from "@src/shared/errors";
import { getUniqueUser } from "@src/shared/services/user/get-unique-user";
import { getAuthCachedUser, cacheAuthUser } from "@src/features/auth/lib/cache";
import { withAssociation } from "@src/shared/api/with-association";
import { env } from "@src/env";
import { logger } from "@src/shared/logger";

export const GET = withAssociation({}, async (_association, { traceId }, req) => {
  const userId = req.headers.get("x-user-id");
  logger.info("GET /api/auth/me - Request started", { traceId, userId });

  if (!userId) {
    logger.error("GET /api/auth/me - Unauthorized (missing x-user-id)", { traceId });
    throw new UnauthorizedError("Unauthorized");
  }

  if (env.NODE_ENV === "production") {
    const cachedUser = await getAuthCachedUser(userId);
    if (cachedUser) {
      logger.info("GET /api/auth/me - Success (cached user returned)", { traceId, userId });
      return SuccessResponse({
        message: "User fetched successfully",
        data: cachedUser,
      });
    }
  }

  const user = await getUniqueUser({
    where: { id: userId },
  });

  if (!user || user.status !== "ACTIVE") {
    logger.error("GET /api/auth/me - User not found or inactive", { traceId, userId });
    throw new UnauthorizedError("User not found or inactive");
  }

  if (env.NODE_ENV === "production") {
    await cacheAuthUser(userId, user);
  }

  logger.info("GET /api/auth/me - Success", { traceId, userId });

  return SuccessResponse({
    message: "User fetched successfully",
    data: user,
  });
});
