import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import { trainingQueryKeys } from "../../utils/constants";

export function useUploadCertificateTemplate(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      http.post(`/training/modules/${moduleId}/certificate-template`, formData),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.modules.detail(moduleId),
        });
        toast.success(res.message || "Certificate template uploaded");
        return res;
      }
      toast.error(res.message || "Failed to upload certificate template");
      return res;
    },
  });
}

export function useRemoveCertificateTemplate(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      http.delete(`/training/modules/${moduleId}/certificate-template`),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.modules.detail(moduleId),
        });
        toast.success("Certificate template removed");
        return res;
      }
      toast.error(res.message || "Failed to remove certificate template");
      return res;
    },
  });
}
