import { HIGH_ROLE_USERS } from '@src/shared/constants';

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

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

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

export interface AddAttendeeForm {
  userId: string;
  attendeeRole: string;
}

export interface RsvpForm {
  status: 'ACCEPTED' | 'DECLINED';
  note?: string;
}
