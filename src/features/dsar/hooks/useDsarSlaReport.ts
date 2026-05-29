import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { ApiResponse } from '@src/shared/utils/http';

interface SlaReport {
  breached: number;
  atRisk: number;
  onTrack: number;
}

export function useDsarSlaReport() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dsar-sla'],
    queryFn: async () => http.get<SlaReport>('/dsar/sla-report'),
  });

  return {
    report: ((data as ApiResponse<SlaReport>)?.data as SlaReport) ?? null,
    isLoading,
    error,
    refetch,
  };
}
