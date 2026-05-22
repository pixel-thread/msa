import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

export function useDeleteTrainingModule() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (moduleId: string) =>
      http.delete<{ success: boolean }>(`/training/modules/${moduleId}`),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["training-modules"] });
        toast.success("Training module deleted successfully");
        return res;
      }
      toast.error(res.message || "Failed to delete module");
      return res;
    },
  });

  return {
    deleteModule: mutation.mutate,
    isDeleting: mutation.isPending,
  };
}
