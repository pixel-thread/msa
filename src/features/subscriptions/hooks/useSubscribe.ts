import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';

interface SubscribeData {
  planId: string;
}

export function useSubscribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId }: SubscribeData) => http.post(`/subscriptions/subscribe`, { planId }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Subscribed successfully');
        queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error('Failed to subscribe');
    },
  });
}
