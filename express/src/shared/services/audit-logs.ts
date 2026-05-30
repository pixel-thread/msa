import { prisma } from '@src/shared/lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';
import type { AuditLogEntry, AuditLogQuery } from '@src/shared/types/audit-logs';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { PAGE_SIZE } from '../constants';

/** Parameters for creating an audit log entry. */
interface LogActionParams {
  actorId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  associationId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
}

/** Persists an audit log entry for a tracked action. */
export async function logAction(params: LogActionParams) {
  const {
    actorId,
    action,
    resourceType,
    resourceId,
    associationId,
    oldValues,
    newValues,
    ipAddress,
    userAgent,
    traceId,
  } = params;

  await prisma.auditLog.create({
    data: {
      associationId,
      actorId,
      action,
      resourceType,
      resourceId: resourceId ?? null,
      oldValues: (oldValues as Prisma.InputJsonValue) ?? Prisma.DbNull,
      newValues: (newValues as Prisma.InputJsonValue) ?? Prisma.DbNull,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      traceId: traceId ?? null,
    },
  });
}

/** Queries audit logs with filtering and pagination. */
export async function findAuditLogs(
  associationId: string,
  query: AuditLogQuery,
): Promise<{
  logs: AuditLogEntry[];
  pagination: ReturnType<typeof buildPagination>;
}> {
  const { page, action, resourceType, actorId, fromDate, toDate } = query;

  const where: Record<string, unknown> = { associationId };

  if (action) where.action = action;
  if (resourceType) where.resourceType = resourceType;
  if (actorId) where.actorId = actorId;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) (where.createdAt as Record<string, Date>).gte = fromDate;
    if (toDate) (where.createdAt as Record<string, Date>).lte = toDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

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
    pagination: buildPagination(total, page),
  };
}

/** Returns aggregate audit-log stats (counts over 7d / 30d / total / top actions). */
export async function getAuditLogStats(associationId: string) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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
