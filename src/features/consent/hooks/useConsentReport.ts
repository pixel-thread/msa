import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { ConsentSummaryReport } from '../types/consent.types';
import type { ApiResponse } from '@src/shared/utils/http';
import { consentEndpoints } from '../utils/constants/endpoints';

export function useConsentReport() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['consent-report'],
    queryFn: async () => http.get<ConsentSummaryReport[]>(consentEndpoints.report),
  });

  return {
    report: ((data as ApiResponse<ConsentSummaryReport[]>)?.data as ConsentSummaryReport[]) ?? [],
    isLoading,
    error,
    refetch,
  };
}
