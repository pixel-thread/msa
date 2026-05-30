import type { UserRole } from '@src/shared/types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 0,
  PRESIDENT: 1,
  SECRETARY: 1,
  FINANCE: 1,
  DPO: 1,
  MEMBER: 2,
};

export const HIGH_ROLE_USERS: UserRole[] = ['SUPER_ADMIN', 'PRESIDENT', 'SECRETARY'];
