import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { announcementEndpoints } from '../utils/constants/endpoints';

export function useMarkAnnouncementRead(announcementId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => http.post(announcementEndpoints.read(announcementId)),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Announcement marked as read');
        queryClient.invalidateQueries({
          queryKey: ['announcement', announcementId],
        });
        queryClient.invalidateQueries({ queryKey: ['announcements-list'] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error('Failed to mark announcement as read');
    },
  });
}
