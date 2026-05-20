import { UserRole } from "@prisma/client";
import { getUser, updateUser } from "@src/features/user/services";
import { UpdateUserSchema } from "@src/features/user/validators";
import { withValidation } from "@src/shared/api";
import { withRole } from "@src/shared/api/with-role";
import { UnauthorizedError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { SuccessResponse } from "@src/shared/utils";

export const GET = withValidation({}, async (req) => {
  const userId = req.headers.get("x-user-id");

  if (!userId) throw new UnauthorizedError("User not found");

  const user = await getUser({ id: userId });

  if (!user) throw new UnauthorizedError("User not found");

  return SuccessResponse({
    data: user,
    message: "User fetched successfully",
  });
});

export const POST = withValidation(
  { body: UpdateUserSchema },
  async (req, _ctx, { body }) => {
    await withRole(req, UserRole.MEMBER);

    const userId = req.headers.get("x-user-id");

    if (!userId) throw new UnauthorizedError("User not found");

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedError("User not found");

    const updatedUser = await updateUser({
      where: { id: userId },
      data: {
        name: body?.name,
        mobile: body?.mobile,
        designation: body?.designation,
        dateOfJoiningGovt: body?.dateOfJoiningGovt,
        dateOfJoiningAssociation: body?.dateOfJoiningAssociation,
      },
    });

    return SuccessResponse({
      data: updatedUser,
      message: "User updated successfully",
    });
  },
);
