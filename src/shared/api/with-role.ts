import { NextRequest } from "next/server";
import type { UserRole as Role } from "@prisma/client";

import { ForbiddenError, UnauthorizedError } from "../errors";
import { prisma } from "../lib/prisma";

const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 0,
  ADMIN: 1,
  USER: 2,
};

export async function withRole(req: NextRequest, role: Role) {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const userRole = user.role as Role;

  const hasPermission = ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[role];

  if (!hasPermission) {
    throw new ForbiddenError("Permission denied");
  }

  return user;
}
