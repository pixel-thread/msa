import type { UserRole as Role } from "@prisma/client";

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 0,
  PRESIDENT: 1,
  SECRETARY: 1,
  FINANCE: 1,
  DPO: 1,
  MEMBER: 2,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[requiredRole];
}
