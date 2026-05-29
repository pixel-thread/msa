import type { ApplicationStatus } from '@src/shared/types';

export type MembershipApplicationListItem = {
  id: string;
  email: string;
  phone: string;
  firstName: string | null;
  lastName: string;
  dateOfBirth: Date;
  age: number;
  gender: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  status: ApplicationStatus;
  rejectionReason: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MembershipApplicationDetail = MembershipApplicationListItem;
