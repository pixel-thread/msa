import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

export function useApproveEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) =>
      http.post(`/ledger/entries/${entryId}/approve`),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Entry approved successfully");
        queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
        queryClient.invalidateQueries({ queryKey: ["ledger-summary"] });
      } else {
        toast.error(response.message || "Failed to approve entry");
      }
    },
    onError: () => {
      toast.error("Failed to approve entry");
    },
  });
}
