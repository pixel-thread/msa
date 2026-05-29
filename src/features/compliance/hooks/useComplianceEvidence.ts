import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { ComplianceEvidence } from '../types/compliance.types';
import type { ApiResponse } from '@src/shared/utils/http';
import { complianceEndpoints } from '../utils/constants/endpoints';

export function useComplianceEvidence() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['compliance-evidence'],
    queryFn: async () => http.get<ComplianceEvidence>(complianceEndpoints.evidence),
  });

  return {
    evidence: (data as ApiResponse<ComplianceEvidence>)?.data ?? null,
    isLoading,
    error,
    refetch,
  };
}
