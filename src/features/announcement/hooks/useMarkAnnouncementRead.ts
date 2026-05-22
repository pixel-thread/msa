import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

export function useMarkAnnouncementRead(announcementId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => http.post(`/announcements/${announcementId}/read`),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Announcement marked as read");
        queryClient.invalidateQueries({
          queryKey: ["announcement", announcementId],
        });
        queryClient.invalidateQueries({ queryKey: ["announcements-list"] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error("Failed to mark announcement as read");
    },
  });
}
