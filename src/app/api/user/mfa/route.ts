import { getUser, updateUser } from "@src/features/user/services";
import { withValidation } from "@src/shared/api";
import { UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

export const POST = withValidation({}, async (req) => {
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

  return SuccessResponse({
    data: { mfaEnable: user.mfaEnabled ? false : true },
    message: "User fetched successfully",
  });
});
