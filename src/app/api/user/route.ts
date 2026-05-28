import { UserRole } from "@prisma/client";
import { getUser, updateUser } from "@src/features/user/services";
import { UpdateUserSchema } from "@src/features/user/validators";
import { withValidation, withRole } from "@src/shared/api";
import { UnauthorizedError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { SuccessResponse } from "@src/shared/utils";
import { logger } from "@src/shared/logger";

export const GET = withValidation({}, async (req, _ctx, { traceId }) => {
  logger.info("GET /api/user - Request started", { traceId });

  const userId = req.headers.get("x-user-id");

  if (!userId) throw new UnauthorizedError("User not found");

  const user = await getUser({ id: userId });

  if (!user) throw new UnauthorizedError("User not found");

  logger.info("GET /api/user - Success", { traceId, userId });

  return SuccessResponse({
    data: user,
    message: "User fetched successfully",
  });
});

export const POST = withValidation(
  { body: UpdateUserSchema },
  async (req, _ctx, { body, traceId }) => {
    logger.info("POST /api/user - Request started", { traceId });

    const user = await withRole(req, UserRole.MEMBER);

    logger.info("POST /api/user - User authorized", {
      traceId,
      userId: user.id,
    });

    const userId = req.headers.get("x-user-id");

    if (!userId) throw new UnauthorizedError("User not found");

    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) throw new UnauthorizedError("User not found");

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

    logger.info("POST /api/user - Success", { traceId, userId });

    return SuccessResponse({
      data: updatedUser,
      message: "User updated successfully",
    });
  },
);
