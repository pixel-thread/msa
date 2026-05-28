import { getUser, updateUser } from "@src/features/user/services";
import { withValidation } from "@src/shared/api";
import { UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import { logger } from "@src/shared/logger";

export const POST = withValidation({}, async (req, _ctx, { traceId }) => {
  logger.info("POST /api/user/mfa - Request started", { traceId });

  const userId = req.headers.get("x-user-id");

  if (!userId) throw new UnauthorizedError("User not found");

  const user = await getUser({
    id: userId,
  });

  if (!user) throw new UnauthorizedError("User not found");

  await updateUser({
    where: { id: userId },
    data: { mfaEnabled: user.mfaEnabled ? false : true },
  });

  logger.info("POST /api/user/mfa - Success", { traceId, userId });

  return SuccessResponse({
    data: { mfaEnable: user.mfaEnabled ? false : true },
    message: "User fetched successfully",
  });
});
