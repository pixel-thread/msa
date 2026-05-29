import http from '@src/shared/utils/http';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paymentEndpoints } from '../utils/constants/endpoints';

export function useActivatePaymentProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (providerId: string) => http.post(paymentEndpoints.activateProvider(providerId), {}),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({
          queryKey: ['payment-providers'],
        });
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });
}
