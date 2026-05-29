import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { ledgerEndpoints } from '../utils/constants/endpoints';

export interface CreateLedgerLineInput {
  accountId: string;
  isDebit: boolean;
  amount: number;
}

export interface CreateLedgerEntryInput {
  description: string;
  paymentId?: string | null;
  lines: CreateLedgerLineInput[];
}

export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLedgerEntryInput) => http.post(ledgerEndpoints.entries, input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Ledger entry created successfully');
        queryClient.invalidateQueries({ queryKey: ['ledger-entries'] });
        queryClient.invalidateQueries({ queryKey: ['ledger-summary'] });
      } else {
        toast.error(response.message || 'Failed to create ledger entry');
      }
    },
    onError: () => {
      toast.error('Failed to create ledger entry');
    },
  });
}
