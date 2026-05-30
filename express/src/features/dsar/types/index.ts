// ---- DSAR - Types

// ---- External Types

import type { DsarRequestType, DsarStatus } from '@src/shared/types';

// ---- DSAR Ticket

/** Represents a DSAR ticket entity. */
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

// ---- DSAR Response

/** Represents a response attached to a DSAR ticket. */
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

// ---- DSAR Ticket Record (API)

/** DSAR ticket record as returned from the API (with string dates). */
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

// ---- DSAR Response Record (API)

/** DSAR response record as returned from the API (with string dates). */
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
