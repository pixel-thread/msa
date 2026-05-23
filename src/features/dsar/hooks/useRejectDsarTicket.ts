import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

export function useRejectDsarTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      http.post(`/dsar/${id}/reject`, { reason }),
    onSuccess: (response) => {
      if ((response as { success: boolean }).success) {
        toast.success("DSAR ticket rejected");
        queryClient.invalidateQueries({ queryKey: ["dsar-tickets"] });
        queryClient.invalidateQueries({ queryKey: ["dsar-sla"] });
        return;
      }
      toast.error((response as { message: string }).message);
    },
    onError: () => {
      toast.error("Failed to reject DSAR ticket");
    },
  });
}
