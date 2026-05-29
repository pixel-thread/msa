import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { ledgerEndpoints } from '../utils/constants/endpoints';

export interface CreateAccountInput {
  code: string;
  name: string;
  type: string;
  description?: string;
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAccountInput) => http.post(ledgerEndpoints.accounts, input),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Account created successfully');
        queryClient.invalidateQueries({ queryKey: ['ledger-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['ledger-summary'] });
      } else {
        toast.error(response.message || 'Failed to create account');
      }
    },
    onError: () => {
      toast.error('Failed to create account');
    },
  });
}
