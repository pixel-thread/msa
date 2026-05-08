import { prisma } from "@src/shared/lib/prisma";
import { SuccessResponse } from "@src/shared/utils";
import { UnauthorizedError } from "@src/shared/errors";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mfaEnabled: true,
      associationId: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new UnauthorizedError("User not found or inactive");
  }

  return SuccessResponse({
    message: "User fetched successfully",
    data: user,
  });
};

