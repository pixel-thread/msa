import type { UserRole as Role } from "@prisma/client";
import { UserRole } from "@prisma/client";

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 0,
  PRESIDENT: 1,
  SECRETARY: 1,
  FINANCE: 1,
  DPO: 1,
  MEMBER: 2,
};

export const HIGH_ROLE_USERS: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.PRESIDENT,
  UserRole.SECRETARY,
];
