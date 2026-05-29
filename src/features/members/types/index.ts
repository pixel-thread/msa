import type { UserRole, UserStatus } from '@src/shared/types';

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

export type MemberListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole[];
  status: UserStatus;
  membershipNumber: string | null;
  createdAt: Date;
};

export type Members = MemberListItem;
