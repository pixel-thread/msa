import type { UserRole } from '@src/shared/types';
import { HIGH_ROLE_USERS } from '@src/shared/constants';

export const hasHighRoleAccess = (roles: UserRole | UserRole[]): boolean => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.some((role) => HIGH_ROLE_USERS.includes(role));
};
