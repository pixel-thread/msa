import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { LogEntry } from '../types';
import { logsEndpoints } from '../utils/constants/endpoints';

export interface UseLogsParams {
  page?: number;
  level?: string;
  search?: string;
  messageExact?: string;
  contentSearch?: string;
  startDate?: string;
  endDate?: string;
  isBackend?: boolean;
  ids?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
}

export function useLogs(params: UseLogsParams = {}) {
  const {
    page = 1,
    level,
    search,
    messageExact,
    contentSearch,
    startDate,
    endDate,
    isBackend,
    ids,
    sortBy,
    sortOrder,
    limit,
  } = params;

  const queryParams: Record<string, string> = {};

  if (page > 1) queryParams.page = String(page);
  if (level) queryParams.level = level;
  if (search) queryParams.search = search;
  if (messageExact) queryParams.messageExact = messageExact;
  if (contentSearch) queryParams.contentSearch = contentSearch;
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (isBackend !== undefined) queryParams.isBackend = String(isBackend);
  if (ids) queryParams.ids = ids;
  if (sortBy) queryParams.sortBy = sortBy;
  if (sortOrder) queryParams.sortOrder = sortOrder;
  if (limit) queryParams.limit = String(limit);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['logs', params],
    queryFn: () =>
      http.get<LogEntry[]>(logsEndpoints.base, {
        params: queryParams,
      }),
  });

  return {
    logs: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}
