import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { subscriptionEndpoints } from '../utils/constants/endpoints';

interface UpdatePlanData {
  planId: string;
  name?: string;
  description?: string;
  amount?: number;
  currency?: string;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  features?: Record<string, unknown>;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  memberTypeId?: string | null;
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, ...data }: UpdatePlanData) =>
      http.patch(subscriptionEndpoints.planById(planId), data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Plan updated successfully');
        queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error('Failed to update plan');
    },
  });
}
