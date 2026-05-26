import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import { trainingQueryKeys } from "../../utils/constants";

export function useUploadGlobalCertificate(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      http.post(`/training/modules/${moduleId}/global-certificate`, formData),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.modules.detail(moduleId),
        });
        toast.success(res.message || "Global certificate uploaded");
        return res;
      }
      toast.error(res.message || "Failed to upload global certificate");
      return res;
    },
  });
}

export function useRemoveGlobalCertificate(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      http.delete(`/training/modules/${moduleId}/global-certificate`),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.modules.detail(moduleId),
        });
        toast.success("Global certificate removed");
        return res;
      }
      toast.error(res.message || "Failed to remove global certificate");
      return res;
    },
  });
}
