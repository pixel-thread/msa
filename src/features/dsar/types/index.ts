import { DsarRequestType, DsarStatus } from "@prisma/client";

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
