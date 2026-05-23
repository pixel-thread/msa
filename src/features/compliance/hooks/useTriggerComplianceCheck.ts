import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

export function useTriggerComplianceCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checkTypes?: string[]) =>
      http.post("/compliance/checks", checkTypes ? { checkTypes } : {}),
    onSuccess: (response) => {
      if ((response as { success: boolean }).success) {
        toast.success("Compliance checks completed successfully");
        queryClient.invalidateQueries({ queryKey: ["compliance-checks"] });
        queryClient.invalidateQueries({ queryKey: ["compliance-evidence"] });
        return;
      }
      toast.error((response as { message: string }).message);
    },
    onError: () => {
      toast.error("Failed to run compliance checks");
    },
  });
}
