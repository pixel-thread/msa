import { useUpdatePlan } from './useUpdatePlan';
import { useDeletePlan } from './useDeletePlan';
import { useSetDefaultPlan } from './useSetDefaultPlan';

export function usePlanTableActions() {
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const setDefaultPlan = useSetDefaultPlan();

  return {
    onStatusChange: (planId: string, isActive: boolean) => {
      updatePlan.mutate({ planId, isActive });
    },
    onDelete: (planId: string) => {
      deletePlan.mutate(planId);
    },
    onSetDefault: (planId: string) => {
      setDefaultPlan.mutate(planId);
    },
    isPending: updatePlan.isPending || deletePlan.isPending,
  };
}
