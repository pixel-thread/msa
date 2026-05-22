import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

export function useDeleteTrainingSupplement(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplementId: string) =>
      http.delete(`/training/modules/${moduleId}/supplements/${supplementId}`),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ["training-supplements", moduleId],
        });
        toast.success("Supplement deleted successfully");
        return res;
      }
      toast.error(res.message || "Failed to delete supplement");
      return res;
    },
  });
}
