import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { DsarTicketRecord } from '../types';
import type { ApiResponse } from '@src/shared/utils/http';
import { dsarEndpoints } from '../utils/constants/endpoints';

export function useDsarTicketDetail(id: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dsar-ticket', id],
    queryFn: async () => http.get<DsarTicketRecord>(dsarEndpoints.byId(id!)),
    enabled: !!id,
  });

  return {
    ticket: ((data as ApiResponse<DsarTicketRecord>)?.data as DsarTicketRecord) ?? null,
    isLoading,
    error,
  };
}
