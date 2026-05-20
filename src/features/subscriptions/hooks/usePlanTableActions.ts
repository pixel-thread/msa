import { useUpdatePlan } from "./useUpdatePlan";
import { useDeletePlan } from "./useDeletePlan";

export function usePlanTableActions() {
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  return {
    onStatusChange: (planId: string, isActive: boolean) => {
      updatePlan.mutate({ planId, isActive });
    },
    onDelete: (planId: string) => {
      deletePlan.mutate(planId);
    },
    isPending: updatePlan.isPending || deletePlan.isPending,
  };
}
