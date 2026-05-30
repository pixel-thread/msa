import type { UserRole, UserStatus } from '@src/shared/types';

/** Full member record including profile details and attendance count. */
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

/** Summary member record used in list views. */
export type MemberListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole[];
  status: UserStatus;
  membershipNumber: string | null;
  createdAt: Date;
};

/** Alias for a single MemberListItem. */
export type Members = MemberListItem;
