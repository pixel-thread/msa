import type { Status, UserRole } from "@prisma/client";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: UserRole[];
  status: Status;
  membershipNumber: null | number;
  designation: null | string;
  mobile: null | number;
  dateOfJoiningGovt: string;
  dateOfJoiningMfsa: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    meetingAttendances: number;
  };
};

export type MemberListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole[];
  status: Status;
  membershipNumber: number | null;
  createdAt: string;
};

export type Members = MemberListItem;
