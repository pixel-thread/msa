export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

export interface AuditLogQuery {
  page: number;
  action?: string;
  resourceType?: string;
  actorId?: string;
  fromDate?: Date;
  toDate?: Date;
}
