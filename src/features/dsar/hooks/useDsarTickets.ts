import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { DsarTicketRecord } from '../types';
import type { ApiResponse } from '@src/shared/utils/http';
import type { PaginationMeta } from '@src/shared/types/api.types';
import { dsarEndpoints } from '../utils/constants/endpoints';

interface UseDsarTicketsOptions {
  page?: number;
  limit?: number;
  status?: string;
  requestType?: string;
}

export function useDsarTickets(options?: UseDsarTicketsOptions) {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.status) params.set('status', options.status);
  if (options?.requestType) params.set('requestType', options.requestType);

  const qs = params.toString();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dsar-tickets', options],
    queryFn: async () => http.get<DsarTicketRecord[]>(`${dsarEndpoints.base}${qs ? `?${qs}` : ''}`),
  });

  return {
    tickets: (data as ApiResponse<DsarTicketRecord[]>)?.data ?? [],
    meta: (data as ApiResponse<DsarTicketRecord[]>)?.meta as PaginationMeta | undefined,
    isLoading,
    error,
    refetch,
  };
}
