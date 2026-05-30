/** A single audit-log entry with actor details and changed values. */
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

/** Query filters for retrieving audit logs. */
export interface AuditLogQuery {
  page: number;
  action?: string;
  resourceType?: string;
  actorId?: string;
  fromDate?: Date;
  toDate?: Date;
}
