import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

export function useSetDefaultPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) =>
      http.post(`/subscriptions/plans/default`, { planId }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Default plan updated successfully");
        queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error("Failed to set default plan");
    },
  });
}
