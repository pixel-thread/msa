import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { consentEndpoints } from '../utils/constants/endpoints';

export function useDeleteConsentReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => http.delete(consentEndpoints.byId(id)),
    onSuccess: (response) => {
      if ((response as { success: boolean }).success) {
        toast.success('Consent receipt deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['consent-records'] });
        queryClient.invalidateQueries({ queryKey: ['consent-report'] });
        return;
      }
      toast.error((response as { message: string }).message);
    },
    onError: () => {
      toast.error('Failed to delete consent receipt');
    },
  });
}
