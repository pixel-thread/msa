import { auth } from "@clerk/nextjs/server";

import { ForbiddenError, UnauthorizedError } from "~/shared/errors";
import type { UserRole } from "~/shared/types";

export interface AuthSession {
  userId: string;
  role?: UserRole;
  sessionClaims: CustomJwtSessionClaims; // Using any for Clerk's CustomJwtSessionClaims to avoid extra imports if not needed, but better to use proper types
}

export async function getAuthSession() {
  const session = await auth();
  return session;
}

export async function isAdmin() {
  const session = await auth();
  return session.sessionClaims?.metadata?.role === "admin";
}

export async function requireAdmin() {
  const { sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;

  if (role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
}

export async function requireAuth(
  requiredRole?: UserRole,
): Promise<AuthSession> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new UnauthorizedError("Authentication required");
  }

  const role = sessionClaims.metadata?.role as UserRole | undefined;

  if (requiredRole === "SUPER_ADMIN" && role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }

  return {
    userId,
    role,
    sessionClaims,
  };
}
