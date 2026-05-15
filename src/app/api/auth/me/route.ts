import { SuccessResponse } from "@src/shared/utils";
import { UnauthorizedError } from "@src/shared/errors";
import { NextRequest } from "next/server";
import { getUniqueUser } from "@src/shared/services/user/getUniqueUser";

export const GET = async (req: NextRequest) => {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  const user = await getUniqueUser({
    where: { id: userId },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new UnauthorizedError("User not found or inactive");
  }

  return SuccessResponse({
    message: "User fetched successfully",
    data: user,
  });
};
