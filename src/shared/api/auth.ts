import { cookies } from "next/headers";

import { UnauthorizedError, ForbiddenError } from "@src/shared/errors";
import { verifyAccessToken } from "@src/shared/lib/jwt";
import type { UserRole } from "@src/shared/types";

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
}

export async function getAuthFromCookies(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    
    if (!token) {
      return null;
    }
    
    const payload = await verifyAccessToken(token);
    
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthSession> {
  const auth = await getAuthFromCookies();
  
  if (!auth) {
    throw new UnauthorizedError("Authentication required");
  }
  
  return auth;
}

export async function requireAdmin() {
  const auth = await requireAuth();
  
  if (auth.role !== "SUPER_ADMIN") {
    throw new ForbiddenError("Admin access required");
  }
  
  return auth;
}

export async function requireRole(requiredRole: UserRole) {
  const auth = await requireAuth();
  
  const roleHierarchy: Record<UserRole, number> = {
    SUPER_ADMIN: 6,
    PRESIDENT: 5,
    SECRETARY: 4,
    FINANCE: 3,
    DPO: 2,
    MEMBER: 1,
  };
  
  if (roleHierarchy[auth.role] < roleHierarchy[requiredRole]) {
    throw new ForbiddenError("Insufficient permissions");
  }
  
  return auth;
}

export function isAdmin() {
  return requireRole("SUPER_ADMIN");
}