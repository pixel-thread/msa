import type { UserRole } from './enums';

export type { UserRole };

/**
 * Standardized direction for sorting data.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Representation of an authenticated user in the system.
 */
export interface ApiUser {
  userId: string;
  role: UserRole;
  phone?: string | null;
  email?: string;
  name?: string | null;
}

/**
 * Metadata stored in Clerk to handle authorization and profile requirements.
 */
export interface UserPublicMetadata {
  role?: UserRole;
  onboarded?: boolean;
}
