import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

export function useDeactivateAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => http.post(`/associations/${id}/deactivate`),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Association deactivated successfully");
        queryClient.invalidateQueries({ queryKey: ["associations-list"] });
        queryClient.invalidateQueries({ queryKey: ["associations"] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error("Failed to deactivate association");
    },
  });
}
