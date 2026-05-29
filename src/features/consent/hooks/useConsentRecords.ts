import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { ConsentReceiptRecord } from '../types/consent.types';
import type { PaginationMeta } from '@src/shared/types/api.types';
import type { ApiResponse } from '@src/shared/utils/http';
import { consentEndpoints } from '../utils/constants/endpoints';

interface UseConsentRecordsOptions {
  page?: number;
  pageSize?: number;
  purpose?: string;
  status?: string;
  search?: string;
}

export function useConsentRecords(options?: UseConsentRecordsOptions) {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.pageSize) params.set('pageSize', String(options.pageSize));
  if (options?.purpose) params.set('purpose', options.purpose);
  if (options?.status) params.set('status', options.status);
  if (options?.search) params.set('search', options.search);

  const qs = params.toString();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['consent-records', options],
    queryFn: async () => http.get<ConsentReceiptRecord[]>(`${consentEndpoints.all}${qs ? `?${qs}` : ''}`),
  });

  return {
    records: (data as ApiResponse<ConsentReceiptRecord[]>)?.data ?? [],
    meta: (data as ApiResponse<ConsentReceiptRecord[]>)?.meta as PaginationMeta | undefined,
    isLoading,
    error,
    refetch,
  };
}
