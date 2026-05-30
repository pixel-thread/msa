// ---- Audit-log service

// Shared utilities
import { buildPagination } from '@src/shared/utils/build-pagination';

// Prisma
import { prisma } from '@src/shared/lib/prisma';

// Types
import type { AuditLogEntry, AuditLogQuery } from '../types';

// ---- findAuditLogs

/**
 * Retrieve paginated audit log entries for a given association, with optional filters.
 *
 * Supports filtering by action type, resource type, actor ID, and date range.
 * Returns formatted log entries and pagination metadata.
 */
export async function findAuditLogs(
  associationId: string,
  query: AuditLogQuery,
): Promise<{
  logs: AuditLogEntry[];
  pagination: ReturnType<typeof buildPagination>;
}> {
  // ---- Build query filter from optional parameters

  const { page, limit, action, resourceType, actorId, fromDate, toDate } = query;

  const where: Record<string, unknown> = { associationId };

  if (action) where.action = action;
  if (resourceType) where.resourceType = resourceType;
  if (actorId) where.actorId = actorId;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) (where.createdAt as Record<string, Date>).gte = fromDate;
    if (toDate) (where.createdAt as Record<string, Date>).lte = toDate;
  }

  // ---- Execute paginated query and count concurrently

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // ---- Format raw database rows into API response shape

  const formattedLogs: AuditLogEntry[] = logs.map((log) => ({
    id: log.id,
    actorId: log.actorId,
    actorName: log.actor?.name ?? null,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt,
    oldValues: log.oldValues as Record<string, unknown> | null,
    newValues: log.newValues as Record<string, unknown> | null,
  }));

  return {
    logs: formattedLogs,
    pagination: buildPagination(total, page, limit),
  };
}

// ---- getAuditLogStats

/**
 * Retrieve audit log statistics for a given association.
 *
 * Provides counts for 7-day, 30-day, and all-time periods,
 * plus the top 10 most frequent actions.
 */
export async function getAuditLogStats(associationId: string) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // ---- Fetch all stats concurrently

  const [last7Days, last30Days, total, byAction] = await Promise.all([
    prisma.auditLog.count({
      where: { associationId, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.auditLog.count({
      where: { associationId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.auditLog.count({ where: { associationId } }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { associationId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    total,
    last7Days,
    last30Days,
    topActions: byAction.map((a) => ({
      action: a.action,
      count: a._count.id,
    })),
  };
}
