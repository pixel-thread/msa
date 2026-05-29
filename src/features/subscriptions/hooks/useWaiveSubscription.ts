import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { subscriptionEndpoints } from '../utils/constants/endpoints';

interface WaiveSubscriptionData {
  subscriptionId: string;
  reason: string;
}

export function useWaiveSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriptionId, reason }: WaiveSubscriptionData) =>
      http.post(subscriptionEndpoints.waive, { subscriptionId, reason }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Subscription waived successfully');
        queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error('Failed to waive subscription');
    },
  });
}
