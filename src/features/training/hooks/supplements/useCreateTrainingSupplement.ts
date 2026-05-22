import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

export function useCreateTrainingSupplement(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      http.post(`/training/modules/${moduleId}/supplements`, formData, {
        headers: { "Content-Type": undefined },
      }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ["training-supplements", moduleId],
        });
        toast.success("Supplement added successfully");
        return res;
      }
      toast.error(res.message || "Failed to add supplement");
      return res;
    },
  });
}
