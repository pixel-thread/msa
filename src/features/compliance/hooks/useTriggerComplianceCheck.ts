import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { complianceEndpoints } from '../utils/constants/endpoints';

export function useTriggerComplianceCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checkTypes?: string[]) =>
      http.post(complianceEndpoints.checks, checkTypes ? { checkTypes } : {}),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Compliance checks completed successfully');
        queryClient.invalidateQueries({ queryKey: ['compliance-checks'] });
        queryClient.invalidateQueries({ queryKey: ['compliance-evidence'] });
        return;
      }
      toast.error(response.message);
      return;
    },
    onError: () => {
      toast.error('Failed to run compliance checks');
    },
  });
}
