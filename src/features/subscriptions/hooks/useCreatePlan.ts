import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import type { CreateSubscriptionPlanInput } from "../validators";

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubscriptionPlanInput) =>
      http.post(`/subscriptions/plans`, data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Plan created successfully");
        queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error("Failed to create plan");
    },
  });
}
