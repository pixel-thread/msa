import { requireAuth, withValidation } from "@src/shared/api";
import { UnauthorizedError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { NextResponse } from "next/server";

export const GET = withValidation({}, async ({}) => {
  const { userId } = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) throw new UnauthorizedError("Unauthorized");

  return NextResponse.json({
    success: true,
    message: "User fetched successfully",
    data: user,
  });
});

