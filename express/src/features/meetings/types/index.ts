// ---- Meetings Types - Data Transfer Objects

import { HIGH_ROLE_USERS } from '@src/shared/constants';

// ---- Meeting DTO

/** Meeting data transfer object. */
export interface Meeting {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  venue: string | null;
  createdBy: {
    name: string;
    email: string;
  };
  _count: {
    attendees: number;
  };
}

// ---- Member DTO

/** Member data transfer object. */
export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

// ---- Attendee DTO

/** Attendee data transfer object. */
export interface Attendee {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  rsvpStatus?: string;
  attendeeRole: string;
}

// ---- Form Types

/** Form data for adding an attendee. */
export interface AddAttendeeForm {
  userId: string;
  attendeeRole: string;
}

/** Form data for RSVP submission. */
export interface RsvpForm {
  status: 'ACCEPTED' | 'DECLINED';
  note?: string;
}
