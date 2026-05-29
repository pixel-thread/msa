import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { PaginationMeta } from '@src/shared/types';
import { ledgerEndpoints } from '../utils/constants/endpoints';

export interface LedgerLineResponse {
  id: string;
  ledgerEntryId: string;
  accountId: string;
  isDebit: boolean;
  amount: number;
  createdAt: string;
}

export interface LedgerEntryResponse {
  id: string;
  paymentTransactionId: string | null;
  description: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdById: string;
  approvedById: string | null;
  createdAt: string;
  updatedAt: string;
  lines: LedgerLineResponse[];
}

interface UseLedgerEntriesParams {
  page?: number;
}

export function useLedgerEntries(params: UseLedgerEntriesParams = {}) {
  const { page = 1 } = params;

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ledger-entries', page],
    queryFn: () => http.get<LedgerEntryResponse[]>(`${ledgerEndpoints.entries}?${queryParams.toString()}`),
  });

  return {
    entries: data?.data ?? [],
    meta: data?.meta as PaginationMeta | undefined,
    isLoading,
    error,
    refetch,
  };
}
