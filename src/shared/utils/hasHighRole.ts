import { UserRole } from "@prisma/client";

const HIGH_ROLE_USERS: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.PRESIDENT,
  UserRole.SECRETARY,
];

export const hasHighRoleAccess = (roles: UserRole[]): boolean => {
  return roles.some((role) => HIGH_ROLE_USERS.includes(role));
};
