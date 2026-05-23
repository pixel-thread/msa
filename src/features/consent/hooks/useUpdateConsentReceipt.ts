import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import type { UpdateConsentReceiptInput } from "../validators/consent.validators";

export function useUpdateConsentReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateConsentReceiptInput;
    }) => http.patch(`/consent/${id}`, data),
    onSuccess: (response) => {
      if ((response as { success: boolean }).success) {
        toast.success("Consent receipt updated successfully");
        queryClient.invalidateQueries({ queryKey: ["consent-records"] });
        queryClient.invalidateQueries({ queryKey: ["consent-report"] });
        return;
      }
      toast.error((response as { message: string }).message);
    },
    onError: () => {
      toast.error("Failed to update consent receipt");
    },
  });
}
