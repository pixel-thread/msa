import { useQuery } from '@tanstack/react-query';
import type { AuditLogEntry } from '../types';
import http from '@src/shared/utils/http';

interface UseAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  resourceType?: string;
  actorId?: string;
  fromDate?: string;
  toDate?: string;
}

interface AuditLogsApiResponse {
  logs: AuditLogEntry[];
  stats: {
    total: number;
    last7Days: number;
    last30Days: number;
    topActions: { action: string; count: number }[];
  };
}

export function useAuditLogs(params: UseAuditLogsParams = {}) {
  const { page = 1, limit = 50, action, resourceType, actorId, fromDate, toDate } = params;

  const queryParams: Record<string, string> = {};
  if (page !== 1) queryParams.page = String(page);
  if (limit !== 50) queryParams.limit = String(limit);
  if (action) queryParams.action = action;
  if (resourceType) queryParams.resourceType = resourceType;
  if (actorId) queryParams.actorId = actorId;
  if (fromDate) queryParams.fromDate = fromDate;
  if (toDate) queryParams.toDate = toDate;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () =>
      http.get<AuditLogsApiResponse>('/audit-logs', {
        params: queryParams,
      }),
  });
  const logsAudit = data?.data?.logs;
  const meta = data?.meta;
  const stats = data?.data?.stats;

  return {
    logs: logsAudit ?? [],
    meta: meta,
    stats: stats ?? {
      total: 0,
      last7Days: 0,
      last30Days: 0,
      topActions: [],
    },
    isLoading,
    error,
    refetch,
  };
}

export type { UseAuditLogsParams };
