import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { ComplianceRecord } from '../types/compliance.types';
import type { ApiResponse } from '@src/shared/utils/http';
import type { PaginationMeta } from '@src/shared/types/api.types';
import { complianceEndpoints } from '../utils/constants/endpoints';

interface UseComplianceChecksOptions {
  page?: number;
  limit?: number;
  checkType?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export function useComplianceChecks(options?: UseComplianceChecksOptions) {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.checkType) params.set('checkType', options.checkType);
  if (options?.status) params.set('status', options.status);
  if (options?.fromDate) params.set('fromDate', options.fromDate);
  if (options?.toDate) params.set('toDate', options.toDate);

  const qs = params.toString();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['compliance-checks', options],
    queryFn: async () => http.get<ComplianceRecord[]>(`${complianceEndpoints.checks}${qs ? `?${qs}` : ''}`),
  });

  return {
    checks: (data as ApiResponse<ComplianceRecord[]>)?.data ?? [],
    meta: (data as ApiResponse<ComplianceRecord[]>)?.meta as PaginationMeta | undefined,
    isLoading,
    error,
    refetch,
  };
}
