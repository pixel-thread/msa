// ---- Audit-log types

/** Represents a single audit log entry. */
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

/** Query parameters for filtering audit logs. */
export interface AuditLogQuery {
  page: number;
  limit: number;
  action?: string;
  resourceType?: string;
  actorId?: string;
  fromDate?: Date;
  toDate?: Date;
}
