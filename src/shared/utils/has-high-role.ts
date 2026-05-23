import { UserRole } from "@prisma/client";

const HIGH_ROLE_USERS: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.PRESIDENT,
  UserRole.SECRETARY,
];

export const hasHighRoleAccess = (roles: UserRole | UserRole[]): boolean => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.some((role) => HIGH_ROLE_USERS.includes(role));
};
