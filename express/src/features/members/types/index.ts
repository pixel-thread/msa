// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------
import type { UserRole, UserStatus } from '@src/shared/types';

// ---------------------------------------------------------------------------
// Member — full profile including attendance count
// Business intent: used in the single-member detail view where all fields
//   plus meeting-attendance metadata are needed.
// ---------------------------------------------------------------------------
export type Member = {
  id: string;
  name: string;
  email: string;
  role: UserRole[];
  status: UserStatus;
  membershipNumber: null | string;
  designation: null | string;
  mobile: null | number;
  dateOfJoiningGovt: string;
  dateOfJoiningAssociation: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    meetingAttendances: number;
  };
};

// ---------------------------------------------------------------------------
// MemberListItem — summary record used in list views
// Business intent: lighter shape returned by paginated directory endpoints
//   to minimise payload size.
// ---------------------------------------------------------------------------
export type MemberListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole[];
  status: UserStatus;
  membershipNumber: string | null;
  createdAt: Date;
};

// ---------------------------------------------------------------------------
// Members — alias for a single MemberListItem
// ---------------------------------------------------------------------------
export type Members = MemberListItem;
