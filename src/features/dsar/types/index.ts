import type { DsarRequestType, DsarStatus } from '@src/shared/types';

export interface DsarTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  requestType: DsarRequestType;
  requestedData: string[];
  description: string | null;
  status: DsarStatus;
  assignedToId: string | null;
  responseDeadline: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  member?: {
    name: string;
    email: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  } | null;
}

export interface DsarResponse {
  id: string;
  dsarTicketId: string;
  responseType: string;
  storageKey: string | null;
  deliveryMethod: string;
  notes: string | null;
  deliveredAt: Date | null;
  createdAt: Date;
}

export interface DsarTicketRecord {
  id: string;
  ticketNumber: string;
  userId: string;
  requestType: string;
  requestedData: string[];
  description: string | null;
  status: string;
  assignedToId: string | null;
  responseDeadline: string;
  rejectedReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  member?: { id: string; name: string; email: string } | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  responses?: DsarResponseRecord[];
}

export interface DsarResponseRecord {
  id: string;
  dsarTicketId: string;
  responseType: string;
  storageKey: string | null;
  deliveryMethod: string;
  notes: string | null;
  deliveredAt: string | null;
  createdAt: string;
}
