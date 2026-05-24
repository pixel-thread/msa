import { SuccessResponse } from "@src/shared/utils";
import { UnauthorizedError } from "@src/shared/errors";
import { getUniqueUser } from "@src/shared/services/user/get-unique-user";
import { getAuthCachedUser, cacheAuthUser } from "@src/features/auth/lib/cache";
import { withAssociation } from "@src/shared/api/with-association";
import { env } from "@src/env";

export const GET = withAssociation({}, async (_association, _params, req) => {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  if (env.NODE_ENV === "production") {
    const cachedUser = await getAuthCachedUser(userId);
    if (cachedUser) {
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
    throw new UnauthorizedError("User not found or inactive");
  }

  if (env.NODE_ENV === "production") {
    await cacheAuthUser(userId, user);
  }

  return SuccessResponse({
    message: "User fetched successfully",
    data: user,
  });
});
