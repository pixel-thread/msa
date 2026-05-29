import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { ComplianceRecord } from '../types/compliance.types';
import type { ApiResponse } from '@src/shared/utils/http';
import { complianceEndpoints } from '../utils/constants/endpoints';

export function useComplianceCheckDetail(checkId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['compliance-check', checkId],
    queryFn: async () => http.get<ComplianceRecord>(complianceEndpoints.checkById(checkId!)),
    enabled: !!checkId,
  });

  return {
    check: ((data as ApiResponse<ComplianceRecord>)?.data as ComplianceRecord | null) ?? null,
    isLoading,
    error,
  };
}
