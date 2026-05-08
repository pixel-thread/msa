import { SuccessResponse } from "@src/shared/utils/responses";
import { prisma } from "@src/shared/lib/prisma";
import { withRole } from "@src/shared/api/with-role";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  await withRole(request, UserRole.MEMBER);

  const associations = await prisma.association.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return SuccessResponse({ data: associations });
};