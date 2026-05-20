import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) =>
      http.delete(`/subscriptions/plans/${planId}`),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Plan deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error("Failed to delete plan");
    },
  });
}
