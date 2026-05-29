import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { Account } from '@src/shared/types';
import { ledgerEndpoints } from '../utils/constants/endpoints';

interface LedgerSummaryData {
  accounts: Account[];
  summary: string;
}

export function useLedgerSummary() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ledger-summary'],
    queryFn: () => http.get<LedgerSummaryData>(ledgerEndpoints.summary),
  });

  return {
    summary: data?.data,
    isLoading,
    error,
    refetch,
  };
}
