import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import type { UpdateSupplementInput } from "../../validators/training";

export function useUpdateTrainingSupplement(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      supplementId,
      data,
    }: {
      supplementId: string;
      data: UpdateSupplementInput | FormData;
    }) =>
      http.patch(
        `/training/modules/${moduleId}/supplements/${supplementId}`,
        data,
        {
          headers:
            data instanceof FormData
              ? { "Content-Type": undefined }
              : undefined,
        },
      ),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ["training-supplements", moduleId],
        });
        toast.success("Supplement updated successfully");
        return res;
      }
      toast.error(res.message || "Failed to update supplement");
      return res;
    },
  });
}
